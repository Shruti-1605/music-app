from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///music_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Track(db.Model):
    __tablename__ = 'tracks'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    duration = db.Column(db.Integer)
    category = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Podcast(db.Model):
    __tablename__ = 'podcasts'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    host = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    duration = db.Column(db.Integer)
    podcast_name = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Playlist(db.Model):
    __tablename__ = 'playlists'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PlaylistTrack(db.Model):
    __tablename__ = 'playlist_tracks'
    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('playlists.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'))
    podcast_id = db.Column(db.Integer, db.ForeignKey('podcasts.id'))
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

class RecentlyPlayed(db.Model):
    __tablename__ = 'recently_played'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    track_id = db.Column(db.Integer, db.ForeignKey('tracks.id'))
    podcast_id = db.Column(db.Integer, db.ForeignKey('podcasts.id'))
    played_at = db.Column(db.DateTime, default=datetime.utcnow)

# Routes
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = create_access_token(identity=user.id)
        return jsonify({'token': token, 'user_id': user.id, 'is_admin': user.is_admin})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/tracks')
def get_tracks():
    tracks = Track.query.all()
    return jsonify([{
        'id': t.id,
        'title': t.title,
        'artist': t.artist,
        'duration': t.duration,
        'category': t.category,
        'type': 'track'
    } for t in tracks])

@app.route('/podcasts')
def get_podcasts():
    podcasts = Podcast.query.all()
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'host': p.host,
        'duration': p.duration,
        'podcast_name': p.podcast_name,
        'category': p.category,
        'type': 'podcast'
    } for p in podcasts])

@app.route('/search')
def search():
    query = request.args.get('q', '')
    tracks = Track.query.filter(Track.title.ilike(f'%{query}%') | Track.artist.ilike(f'%{query}%')).all()
    podcasts = Podcast.query.filter(Podcast.title.ilike(f'%{query}%') | Podcast.host.ilike(f'%{query}%')).all()
    
    results = []
    for t in tracks:
        results.append({'id': t.id, 'title': t.title, 'artist': t.artist, 'type': 'track'})
    for p in podcasts:
        results.append({'id': p.id, 'title': p.title, 'host': p.host, 'type': 'podcast'})
    
    return jsonify(results)

@app.route('/stream/<content_type>/<int:content_id>')
def stream_content(content_type, content_id):
    if content_type == 'track':
        content = Track.query.get_or_404(content_id)
    else:
        content = Podcast.query.get_or_404(content_id)
    return send_file(content.file_path)

@app.route('/playlists', methods=['GET', 'POST'])
@jwt_required()
def playlists():
    user_id = get_jwt_identity()
    
    if request.method == 'POST':
        data = request.get_json()
        playlist = Playlist(name=data['name'], user_id=user_id)
        db.session.add(playlist)
        db.session.commit()
        return jsonify({'id': playlist.id, 'name': playlist.name}), 201
    
    playlists = Playlist.query.filter_by(user_id=user_id).all()
    return jsonify([{'id': p.id, 'name': p.name} for p in playlists])

@app.route('/playlists/<int:playlist_id>/tracks', methods=['GET', 'POST'])
@jwt_required()
def playlist_tracks(playlist_id):
    if request.method == 'POST':
        data = request.get_json()
        pt = PlaylistTrack(
            playlist_id=playlist_id,
            track_id=data.get('track_id'),
            podcast_id=data.get('podcast_id')
        )
        db.session.add(pt)
        db.session.commit()
        return jsonify({'message': 'Content added to playlist'}), 201
    
    playlist_items = db.session.query(PlaylistTrack).filter_by(playlist_id=playlist_id).all()
    results = []
    
    for item in playlist_items:
        if item.track_id:
            track = Track.query.get(item.track_id)
            results.append({'id': track.id, 'title': track.title, 'artist': track.artist, 'type': 'track'})
        elif item.podcast_id:
            podcast = Podcast.query.get(item.podcast_id)
            results.append({'id': podcast.id, 'title': podcast.title, 'host': podcast.host, 'type': 'podcast'})
    
    return jsonify(results)

@app.route('/recently-played', methods=['GET', 'POST'])
@jwt_required()
def recently_played():
    user_id = get_jwt_identity()
    
    if request.method == 'POST':
        data = request.get_json()
        recent = RecentlyPlayed(
            user_id=user_id,
            track_id=data.get('track_id'),
            podcast_id=data.get('podcast_id')
        )
        db.session.add(recent)
        db.session.commit()
        return jsonify({'message': 'Recently played updated'})
    
    recent_items = RecentlyPlayed.query.filter_by(user_id=user_id).order_by(RecentlyPlayed.played_at.desc()).limit(10).all()
    results = []
    
    for item in recent_items:
        if item.track_id:
            track = Track.query.get(item.track_id)
            results.append({'id': track.id, 'title': track.title, 'artist': track.artist, 'type': 'track'})
        elif item.podcast_id:
            podcast = Podcast.query.get(item.podcast_id)
            results.append({'id': podcast.id, 'title': podcast.title, 'host': podcast.host, 'type': 'podcast'})
    
    return jsonify(results)

# Admin Routes
@app.route('/admin/upload', methods=['POST'])
@jwt_required()
def upload_file():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.is_admin:
        return jsonify({'message': 'Admin access required'}), 403
    
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    return jsonify({'message': 'File uploaded', 'file_path': file_path}), 201

@app.route('/admin/tracks', methods=['POST'])
@jwt_required()
def add_track():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.is_admin:
        return jsonify({'message': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if data.get('is_podcast'):
        content = Podcast(
            title=data['title'],
            host=data['artist'],
            file_path=data['file_path'],
            duration=data.get('duration', 0),
            podcast_name=data.get('podcast_name', ''),
            category=data.get('category')
        )
    else:
        content = Track(
            title=data['title'],
            artist=data['artist'],
            file_path=data['file_path'],
            duration=data.get('duration', 0),
            category=data.get('category')
        )
    
    db.session.add(content)
    db.session.commit()
    
    return jsonify({'message': 'Content added', 'id': content.id}), 201

@app.route('/admin/content/<content_type>/<int:content_id>', methods=['DELETE'])
@jwt_required()
def delete_content(content_type, content_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.is_admin:
        return jsonify({'message': 'Admin access required'}), 403
    
    if content_type == 'track':
        content = Track.query.get_or_404(content_id)
    else:
        content = Podcast.query.get_or_404(content_id)
    
    db.session.delete(content)
    db.session.commit()
    return jsonify({'message': 'Content deleted'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Add sample data if empty
        if not Track.query.first():
            # Create admin user
            admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=generate_password_hash("admin123"),
                is_admin=True
            )
            db.session.add(admin)
            
            # Sample tracks
            track1 = Track(title="Sample Song 1", artist="Artist 1", file_path="sample1.mp3", duration=180, category="Pop")
            track2 = Track(title="Sample Song 2", artist="Artist 2", file_path="sample2.mp3", duration=210, category="Rock")
            
            # Sample podcasts
            podcast1 = Podcast(title="Tech Talk Ep1", host="Tech Host", file_path="podcast1.mp3", duration=1800, podcast_name="Tech Talk", category="Technology")
            
            db.session.add_all([track1, track2, podcast1])
            db.session.commit()
    
    app.run(debug=True)