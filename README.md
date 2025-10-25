# Event Photo Sharing App 📸

A modern web application for sharing and organizing event photos with AI-powered face detection. Create events, share access codes, upload photos, and let AI help attendees find themselves in the memories!

## ✨ Features

- 🔐 **Secure Event Access** - QR codes and access codes for private events
- 📸 **Easy Uploads** - Drag-and-drop or camera capture for instant sharing
- 🧠 **AI Face Detection** - Automatically find yourself in event photos using Azure Face API
- 👥 **Smart Grouping** - AI clusters photos of the same person
- 🎨 **Modern UI** - Beautiful, responsive design built with React
- 🌍 **Public/Private Events** - Flexible privacy controls for organizers
- 📱 **Mobile-First** - Works seamlessly on all devices

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL
- **Storage**: Azure Blob Storage
- **AI**: Azure Face API
- **Auth**: Firebase (Google OAuth)
- **Deployment**: Docker + Azure

[View full tech stack details →](./docs/TECH_STACK.md)

## 📋 Project Structure

```
-234_Team/
├── backend/           # FastAPI backend application
├── frontend/          # React + Vite frontend
├── docs/             # Additional documentation
├── docker-compose.yml # Local development setup
├── description.md    # Detailed project description
├── TECH_STACK.md    # Technology decisions and rationale
├── SETUP.md         # Complete setup instructions
├── .cursorrules     # AI assistant coding guidelines
└── .cursorignore    # Files to exclude from AI context
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- Azure account (for Face API, Blob Storage, PostgreSQL)
- Firebase project (for authentication)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/-234_Team.git
   cd -234_Team
   ```

2. **Follow the setup guide**
   
   📖 [Complete Setup Instructions →](./docs/SETUP.md)

3. **Start development servers**
   ```bash
   # Backend
   cd backend
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   uvicorn app.main:app --reload
   
   # Frontend (in new terminal)
   cd frontend
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API docs: http://localhost:8000/docs

## 📚 Documentation

- [**SETUP.md**](./docs/SETUP.md) - Complete setup and installation guide
- [**TECH_STACK.md**](./docs/TECH_STACK.md) - Technology stack documentation
- [**DATABASE_SCHEMA.md**](./docs/DATABASE_SCHEMA.md) - Database design and SQL
- [**description.md**](./description.md) - Detailed project overview and features
- [**.cursorrules**](./.cursorrules) - Coding standards and guidelines

## 🎯 Core Workflows

### Creating an Event
1. Sign in with Google
2. Click "Create Event"
3. Add event details (name, date, location, privacy settings)
4. Share the access code or QR code with attendees

### Uploading Photos
1. Enter event access code
2. Drag and drop photos or use camera
3. Photos upload directly to Azure Blob Storage
4. AI processes faces in the background

### Finding Yourself
1. Browse event gallery
2. Click on any photo with your face
3. View "Find Similar" to see all photos with you
4. Tag yourself for easier future discovery

## 🔒 Security & Privacy

- Face data is **never shared across events**
- All face detection is scoped per event
- GDPR compliant - face data deleted when event is deleted
- Secure authentication via Firebase
- Access codes required for private events
- Presigned URLs for secure uploads (5-minute expiry)

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Follow coding standards in `.cursorrules`
3. Write tests for new features
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📝 Coding Guidelines

This project uses `.cursorrules` to maintain consistent code quality. Key principles:

- **Python**: Type hints, async/await, Pydantic validation
- **TypeScript**: Strict mode, functional components
- **API**: RESTful design, proper HTTP status codes
- **Security**: Never commit secrets, validate all inputs
- **Testing**: Write tests for critical functionality

[View full guidelines →](./.cursorrules)

## 🌟 Roadmap

### Phase 1: MVP (Current)
- ✅ Basic event creation
- ✅ Photo upload with presigned URLs
- ✅ Firebase authentication
- ✅ Azure Face API integration
- ⏳ Face clustering and search

### Phase 2: Enhancements
- 🔲 Auto highlight video generation
- 🔲 Advanced photo filters and search
- 🔲 Event analytics for organizers
- 🔲 Batch download options
- 🔲 Social media sharing

### Phase 3: Scale
- 🔲 Mobile apps (iOS/Android)
- 🔲 CDN integration for faster loading
- 🔲 Real-time collaborative features
- 🔲 Advanced AI features (object detection, scene recognition)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

**CS 234 Team** - Building the future of event photo sharing!

## 🙏 Acknowledgments

- Azure Face API for AI capabilities
- Firebase for authentication
- FastAPI for the amazing Python web framework
- React community for excellent tooling

---

**Need help?** Check out [SETUP.md](./docs/SETUP.md) or open an issue!

**Questions about the database?** See [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)

**Questions about the tech stack?** See [TECH_STACK.md](./docs/TECH_STACK.md)

**Want to understand the features better?** Read [description.md](./description.md)
