Event Photo Sharing App Overview
Introduction

The Event Photo Sharing App provides a seamless and secure way to capture, upload, and share memories from any event. It centralizes event media into one shared gallery, allowing attendees and photographers to contribute photos and videos easily. With built-in AI face detection and a smooth upload experience, the app helps users find themselves and relive their favorite moments effortlessly.

Core Features
🔐 Access Code System

Every event is protected by a unique access code or QR code, ensuring only authorized users can upload.

Private Events: Access code required for viewing or uploading.

Public Events: Anyone can view; uploading depends on organizer permissions (can_add = owner only / code holders / public).

📸 Easy Upload

Simple drag-and-drop uploads or camera capture.

Media goes directly to secure cloud storage via presigned URLs.

Instant gallery updates for all participants.

🧠 AI Face Detection & Organization

The AI pipeline automatically:

Detects faces and groups photos of the same person.

Allows attendees to find all photos of themselves.

(Optional) Removes duplicate or low-quality images based on sharpness and exposure.

🎞️ Auto Highlights (Optional Stretch)

AI can automatically generate short video recaps or slideshows from the event’s best moments, providing a visually engaging highlight reel.

⚙️ Organizer Dashboard

Event managers get full control:

Approve or reject uploads.

Toggle event privacy (public/private).

Set upload permissions (owner only, code holders, public anyone).

Manage or delete inappropriate content.

How It Works
1. Setup

Event managers create an event (“pool”) after signing up.

The system generates a unique access code and QR code.

Event details include title, logo, location, date/time, and privacy settings.

2. Uploading

Guests enter the access code and upload photos/videos.

The app stores uploads in Amazon S3 (or MinIO/Supabase Storage).

The FastAPI backend saves metadata and triggers background processing.

3. AI Processing

Background worker (FastAPI BackgroundTasks or Celery) sends each image to AWS Rekognition:

Detect faces → store bounding boxes + FaceIds.

Search for similar faces → group into clusters within the same event.

Faces are stored per event — never across events — preserving privacy.

4. Browsing & Discovery

The frontend  fetches the organized media feed.

Users can filter by clusters, tag themselves (“This is me”), and download favorites.

A map view shows nearby public events using the lat/lon coordinates.

Tech Stack Summary
Layer	Technology	Purpose
Frontend	 (React)	Event pages, uploads, gallery UI
Backend	FastAPI (Python)	Core API, presign endpoints, AI job routing
Database		Events, media, faces, clusters, memberships
Storage	blob	Store all uploaded media
AI Services	azure? 	Face detection + similarity search
Deployment	Dockploy + Docker Compose	One-click deployment for web & API