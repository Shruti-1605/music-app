
# Music Streaming App

## Tech Stack

**Frontend:**
- React.js 19
- Tailwind CSS
- HTML5 Audio API
- Axios for API calls

**Backend:**
- Python 3.10+
- Flask (REST APIs)
- Flask-JWT-Extended (Authentication)
- Flask-CORS
- SQLAlchemy ORM

**Database:**
- PostgreSQL (configurable)
- SQLite (fallback for development)

## Database Schema

- **users**: User accounts and authentication
- **tracks**: Music tracks
- **podcasts**: Podcast episodes
- **playlists**: User playlists
- **playlist_tracks**: Playlist content mapping
- **recently_played**: User listening history

## Backend Setup

1. Navigate to the Backend directory:
   ```
   cd Backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the Flask application:
   ```
   python app.py
   ```

The backend will start on http://localhost:5000

## Frontend Setup

1. Navigate to the Frontend directory:
   ```
   cd Frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React development server:
   ```
   npm start
   ```

The frontend will start on http://localhost:3000

## Usage

1. Register a new account or login
2. Browse music and podcasts
3. Use the search functionality
4. Create playlists and add tracks
5. Mark tracks as favorites
6. Stream audio using the built-in player

## Features Implemented

✅ User registration & login
✅ Browse music & podcasts  
✅ Search tracks & episodes
✅ Stream audio using web player
✅ Create & manage playlists
✅ Resume last played audio
✅ Like / favorite tracks
✅ Admin file upload
✅ Admin content management
✅ Metadata management (title, artist, category, podcast name)

## Admin Access

Default admin credentials:
- Username: `admin`
- Password: `admin123`

Admin features:
- Upload audio files
- Add track metadata
- Manage music & podcast content
- Delete tracks

## Sample Data

The app includes sample tracks for testing. To add real audio files:
1. Place audio files in the Backend directory
2. Update the database with correct file paths
3. Ensure file paths in the Track model match your audio files

## Notes

- This is a minimal implementation for demonstration
- For production, add proper file upload, audio format validation, and security measures
- Consider using a proper database like PostgreSQL for production
- Add proper error handling and validation
=======


