from app import app, db, User, Track, Podcast
from werkzeug.security import generate_password_hash

def test_database():
    with app.app_context():
        try:
            # Test database connection
            db.create_all()
            print("✅ Database tables created successfully")
            
            # Test user creation
            if not User.query.filter_by(username='admin').first():
                admin = User(
                    username='admin',
                    email='admin@test.com',
                    password_hash=generate_password_hash('admin123'),
                    is_admin=True
                )
                db.session.add(admin)
                db.session.commit()
                print("✅ Admin user created")
            else:
                print("✅ Admin user already exists")
            
            # Test sample data
            if not Track.query.first():
                track = Track(
                    title="Test Song",
                    artist="Test Artist", 
                    file_path="test.mp3",
                    duration=180,
                    category="Test"
                )
                db.session.add(track)
                db.session.commit()
                print("✅ Sample track created")
            
            # Show database contents
            users = User.query.all()
            tracks = Track.query.all()
            podcasts = Podcast.query.all()
            
            print(f"\n📊 Database Status:")
            print(f"Users: {len(users)}")
            print(f"Tracks: {len(tracks)}")
            print(f"Podcasts: {len(podcasts)}")
            
            print("\n✅ Database is working properly!")
            
        except Exception as e:
            print(f"❌ Database error: {e}")

if __name__ == '__main__':
    test_database()