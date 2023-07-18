const websocket = @import("websocket");
const Client = websocket.Client;
const Message = websocket.Message;
const Handshake = websocket.Handshake;

const Tm1637 = @import("tm1637");

const std = @import("std");
const os = std.os;
const mem = std.mem;

// Define a struct for "global" data passed into your websocket handler
const Context = struct { display: Tm1637 };
var global_context: Context = undefined; // global context (for signal_handler)

pub fn main() !void {
    if (std.os.argv.len != 3) {
        std.log.err("usage: {s} <ADDRESS> <PORT>", .{os.argv[0]});
        os.exit(1);
    }

    const address: []const u8 = mem.span(os.argv[1]);
    const port: u16 = try std.fmt.parseUnsigned(u16, mem.span(os.argv[2]), 10);

    // prepare signal handler. TODO: clean up websocket server.
    const act = os.Sigaction{
        .handler = .{ .handler = signal_handler },
        .mask = os.empty_sigset,
        .flags = 0,
    };
    try os.sigaction(os.SIG.INT, &act, null);

    // initialise display
    var display = try Tm1637.init("/dev/gpiochip0", 24, 11, 7);
    errdefer display.deinit();
    global_context = Context{ .display = display };

    // start websocket server
    const allocator = std.heap.c_allocator;
    try websocket.listen(Handler, allocator, &global_context, .{
        .port = port,
        .max_headers = 10,
        .address = address,
    });
}

const Handler = struct {
    client: *Client,
    context: *Context,

    pub fn init(_: Handshake, client: *Client, context: *Context) !Handler {
        return Handler{
            .client = client,
            .context = context,
        };
    }

    pub fn handle(h: *Handler, message: Message) !void {
        // std.log.info("m: {any}", .{std.fmt.fmtSliceHexLower(message.data)});

        if (message.data.len == 5) {
            h.context.display.brightness = @truncate(message.data[0]);
            h.context.display.write(message.data[1..], 0);
        }
    }

    pub fn close(_: *Handler) void {}
};

fn signal_handler(sig: c_int) callconv(.C) void {
    std.debug.assert(sig == os.SIG.INT);
    global_context.display.deinit();
    os.exit(0);
}
