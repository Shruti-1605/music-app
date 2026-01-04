from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import json
import os

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Simple file-based storage
USERS_FILE = 'users.json'
CONTENT_FILE = 'content.json'

# Load or create users
def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return [{'id': 1, 'username': 'admin', 'email': 'admin@test.com', 'password': 'admin123', 'is_admin': True}]

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# Load or create content
def load_content():
    if os.path.exists(CONTENT_FILE):
        with open(CONTENT_FILE, 'r') as f:
            return json.load(f)
    return {
        'tracks': [],
        'podcasts': [],
        'favorites': {}
    }

def save_content(content):
    with open(CONTENT_FILE, 'w') as f:
        json.dump(content, f)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    users = load_users()
    
    # Check if username already exists
    if any(u['username'] == data['username'] for u in users):
        return jsonify({'message': 'Username already exists'}), 400
    
    # Check if email already exists
    if any(u['email'] == data['email'] for u in users):
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    new_user = {
        'id': len(users) + 1,
        'username': data['username'],
        'email': data['email'],
        'password': data['password'],
        'is_admin': False
    }
    
    users.append(new_user)
    save_users(users)
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    users = load_users()
    
    user = next((u for u in users if u['username'] == data['username'] and u['password'] == data['password']), None)
    
    if user:
        return jsonify({
            'token': f'token-{user["id"]}',
            'user_id': user['id'],
            'username': user['username'],
            'is_admin': user.get('is_admin', False)
        })
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/tracks')
def get_tracks():
    try:
        content = load_content()
        print(f"Loading tracks - found {len(content['tracks'])} tracks")  # Debug
        return jsonify(content['tracks'])
    except Exception as e:
        print(f"Error loading tracks: {str(e)}")
        return jsonify([]), 500

@app.route('/podcasts')
def get_podcasts():
    content = load_content()
    return jsonify(content['podcasts'])

@app.route('/favorites/<int:user_id>', methods=['GET', 'POST'])
def favorites(user_id):
    content = load_content()
    
    if 'favorites' not in content:
        content['favorites'] = {}
    
    user_key = str(user_id)
    
    if request.method == 'POST':
        data = request.get_json()
        track_id = data['track_id']
        
        if user_key not in content['favorites']:
            content['favorites'][user_key] = []
        
        if track_id not in content['favorites'][user_key]:
            content['favorites'][user_key].append(track_id)
            save_content(content)
            return jsonify({'message': 'Added to favorites'})
        else:
            content['favorites'][user_key].remove(track_id)
            save_content(content)
            return jsonify({'message': 'Removed from favorites'})
    
    # GET favorites
    user_favorites = content['favorites'].get(user_key, [])
    favorite_tracks = [track for track in content['tracks'] if track['id'] in user_favorites]
    return jsonify(favorite_tracks)

@app.route('/admin/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No file selected'}), 400
    
    if file and file.filename.lower().endswith(('.mp3', '.wav', '.m4a', '.flac')):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({'message': 'File uploaded successfully', 'file_path': filename}), 201
    
    return jsonify({'message': 'Invalid file type. Only audio files allowed.'}), 400

@app.route('/admin/tracks', methods=['POST'])
def add_track():
    try:
        data = request.get_json()
        print(f"Received track data: {data}")  # Debug
        
        content = load_content()
        print(f"Current tracks count: {len(content['tracks'])}")  # Debug
        
        # Generate proper ID
        max_id = max([t['id'] for t in content['tracks']], default=0)
        
        new_item = {
            'id': max_id + 1,
            'title': data['title'],
            'artist': data['artist'],
            'type': 'track',
            'category': data.get('category', ''),
            'file_path': data['file_path']
        }
        
        content['tracks'].append(new_item)
        save_content(content)
        
        print(f"Track added successfully: {new_item}")  # Debug
        print(f"New tracks count: {len(content['tracks'])}")  # Debug
        
        return jsonify({
            'message': 'Track added successfully', 
            'id': new_item['id'],
            'track': new_item
        }), 201
        
    except Exception as e:
        print(f"Error adding track: {str(e)}")  # Debug
        return jsonify({'message': f'Error: {str(e)}'}), 500

@app.route('/test/add-track')
def test_add_track():
    content = load_content()
    
    test_track = {
        'id': 999,
        'title': 'Test Song',
        'artist': 'Test Artist',
        'type': 'track',
        'category': 'Test',
        'file_path': 'test.mp3'
    }
    
    content['tracks'].append(test_track)
    save_content(content)
    
    return jsonify({'message': 'Test track added', 'track': test_track})

@app.route('/stream/<filename>')
def stream_file(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        return send_file(file_path)
    except:
        return jsonify({'message': 'File not found'}), 404

@app.route('/stream/<content_type>/<int:content_id>')
def stream_content(content_type, content_id):
    content = load_content()
    
    if content_type == 'track':
        track = next((t for t in content['tracks'] if t['id'] == content_id), None)
        if track and 'file_path' in track:
            try:
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], track['file_path'])
                return send_file(file_path)
            except:
                pass
    
    return jsonify({'message': 'File not found or streaming not available'}), 404

if __name__ == '__main__':
    print("🎵 Music App Backend Starting...")
    print("Backend: http://localhost:5000")
    print("✅ Signup/Login enabled")
    print("❤️ Favorites enabled")
    print("📁 Empty music library - Upload songs via Admin")
    app.run(debug=True, port=5000)