import { Server } from "socket.io";

let io: Server | null = null;

export const initSocket = (eventHandler: any) => {
	if (io) return io;

	const server = eventHandler.node?.res?.socket?.server;

	io = new Server(server, {
		cors: { origin: "*" },
	});

	return io;
};
