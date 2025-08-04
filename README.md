# TPV Monitor

A simple TypeScript Node.js monitoring application built with Express.js.

## 🚀 Features

- **TypeScript**: Full type safety with strict mode enabled
- **Express.js**: Lightweight web framework
- **Health Check**: Built-in health monitoring endpoint
- **Development Mode**: Hot reload with nodemon and ts-node
- **Production Ready**: Compiled JavaScript output

## 📁 Project Structure

```
tpv-monitor/
├── src/
│   └── index.ts          # TypeScript source code
├── dist/                 # Compiled JavaScript (auto-generated)
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── .gitignore           # Git ignore rules
```

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/cb-saravanakumarn/tpv-monitor.git
cd tpv-monitor
```

2. Install dependencies:

```bash
npm install
```

## 🚀 Usage

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Build Only

```bash
npm run build
```

### Clean Build Files

```bash
npm run clean
```

## 📡 API Endpoints

### `GET /`

Returns welcome message with current status

```json
{
  "message": "Welcome to TPV Monitor!",
  "status": "running",
  "timestamp": "2025-08-04T06:42:35.614Z"
}
```

### `GET /health`

Returns server health information

```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-08-04T06:42:35.614Z"
}
```

## 🔧 Configuration

- **Port**: Set via `PORT` environment variable (defaults to 3000)
- **TypeScript**: Configured in `tsconfig.json`
- **Dependencies**: Managed in `package.json`

## 📦 Scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm start`     | Build and start production server        |
| `npm run build` | Compile TypeScript to JavaScript         |
| `npm run clean` | Remove compiled files                    |

## 🧪 Testing

Visit the following URLs after starting the server:

- Main endpoint: http://localhost:3000
- Health check: http://localhost:3000/health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

ISC License
