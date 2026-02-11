# Simple Developer Setup

## Frontend Developer Setup

### 1. Clone and Setup (First Time Only)

```bash
git clone https://github.com/shardivy/career-counselling-assessment-platform.git
cd career-counselling-assessment-platform
git checkout frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser and start developing.

### 2. Daily Work

```bash
git pull origin frontend
# Make changes
git add .
git commit -m "your changes"
git push origin frontend
```

That's it! Push to `frontend` branch, lead will pull it into staging.

### 3. Available Commands

```bash
npm run dev      # Development server
npm run build    # Build for production
npm run lint     # Check code quality
```

---

## Backend Developer Setup

### 1. Clone and Setup (First Time Only)

```bash
git clone https://github.com/shardivy/career-counselling-assessment-platform.git
cd career-counselling-assessment-platform
git checkout backend
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# OR
source venv/bin/activate       # Mac/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open http://localhost:8000 in your browser and start developing.

### 2. Daily Work

```bash
git pull origin backend
# Make changes
git add .
git commit -m "your changes"
git push origin backend
```

That's it! Push to `backend` branch, lead will pull it into staging.

### 3. Available Commands

```bash
python manage.py runserver    # Development server
python manage.py migrate       # Run migrations
python manage.py createsuperuser  # Create admin user
```

---

## That's All!

- **Frontend devs:** Work in `frontend` branch, push changes there
- **Backend devs:** Work in `backend` branch, push changes there  
- **Lead:** Pull from both branches into `staging` daily

Simple!
