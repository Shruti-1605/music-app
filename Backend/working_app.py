from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import os

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Simple in-memory storage that works
USERS = [{'id': 1, 'username': 'admin', 'password': 'admin123', 'is_admin': True}]
TRACKS = []

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = next((u for u in USERS if u['username'] == data['username'] and u['password'] == data['password']), None)
    if user:
        return jsonify({'token': 'dummy', 'user_id': user['id'], 'username': user['username'], 'is_admin': user.get('is_admin', False)})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/tracks')
def get_tracks():
    print(f"GET /tracks - Returning {len(TRACKS)} tracks: {TRACKS}")
    return jsonify(TRACKS)

@app.route('/admin/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    return jsonify({'message': 'File uploaded', 'file_path': filename}), 201

@app.route('/admin/tracks', methods=['POST'])
def add_track():
    data = request.get_json()
    print(f"POST /admin/tracks - Received: {data}")
    
    new_track = {
        'id': len(TRACKS) + 1,
        'title': data['title'],
        'artist': data['artist'],
        'category': data.get('category', ''),
        'file_path': data['file_path'],
        'type': 'track'
    }
    
    TRACKS.append(new_track)
    print(f"Added track: {new_track}")
    print(f"Total tracks now: {len(TRACKS)}")
    
    return jsonify({'message': 'Track added successfully', 'id': new_track['id']}), 201

@app.route('/stream/track/<int:track_id>')
def stream_track(track_id):
    track = next((t for t in TRACKS if t['id'] == track_id), None)
    if track and 'file_path' in track:
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], track['file_path'])
            return send_file(file_path)
        except:
            pass
    return jsonify({'message': 'File not found'}), 404

@app.route('/favorites/<int:user_id>', methods=['GET', 'POST'])
def favorites(user_id):
    return jsonify([])  # Simple empty favorites for now

if __name__ == '__main__':
    print("🎵 Simple Music App Backend")
    print("Backend: http://localhost:5000")
    print("Login: admin/admin123")
    app.run(debug=True, port=5000)