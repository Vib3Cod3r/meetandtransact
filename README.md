# Project Vibe - Note From Guide

This app (including all documentation including this README) was over 98% (by lines of code) coded by Claude Sonnet with direction from me in a couple of sessions totalling no more than 6 hours.

Claude needed my help mainly in some of the logic around timezone logic (the database, the user and the target timezone were all different, and Claude is not great at maths) and I also contributed the sendSystemEmail() function to stop Claude repeating himself (as he is prone to do).

# Queen Street Gardens - Key Pickup Appointment System

A web application that allows residents to book appointments for picking up their Queen Street Gardens keys. The system includes both a public booking interface and an admin dashboard for managing appointments.

## Features

### Public Interface
- **Home Page**: Welcome page with information about the gardens and booking process
- **Booking Form**: Users can enter their details and select from available appointment times
- **Form Validation**: Client-side validation for all required fields
- **Email Notifications**: Automatic confirmation emails sent to users

### Admin Interface
- **Secure Login**: Admin authentication with JWT tokens
- **Appointment Management**: Create, edit, and delete appointment slots
- **User Management**: View all registered users and their bookings
- **Real-time Updates**: Live data updates without page refresh

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database for data storage
- **JWT** for admin authentication
- **Nodemailer** for email notifications
- **bcryptjs** for password hashing

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- **CSS3** with modern styling

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd queen-street-gardens-appointments
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FROM_EMAIL=your_email@gmail.com
   ```

4. **Initialize the database**
   ```bash
   node server/setup.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Public site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin
   - Default admin credentials: `admin` / `admin123`

## Usage

### For Users
1. Visit the public website
2. Click "Book Appointment"
3. Fill in your details (name, email, home address)
4. Select an available appointment time
5. Submit the form
6. Check your email for confirmation

### For Administrators
1. Go to the admin login page
2. Sign in with your credentials
3. Use the dashboard to:
   - Create new appointment slots
   - Edit existing appointments
   - Delete appointments
   - View registered users
   - Monitor booking statistics

## API Endpoints

### Public Endpoints
- `GET /api/appointments` - Get available appointments
- `POST /api/appointments/book` - Book an appointment
- `GET /api/users/:email/bookings` - Get user's bookings
- `DELETE /api/users/:email/bookings/:id` - Cancel a booking

### Admin Endpoints
- `POST /api/admin/login` - Admin login
- `GET /api/admin/appointments` - Get all appointments (admin view)
- `POST /api/admin/appointments` - Create new appointment
- `PUT /api/admin/appointments/:id` - Update appointment
- `DELETE /api/admin/appointments/:id` - Delete appointment
- `GET /api/admin/users` - Get all users

## Database Schema

### Tables
- **appointments**: Stores appointment slots with location, datetime, and capacity
- **users**: Stores user information (name, email, address)
- **bookings**: Links users to appointments
- **admin_users**: Stores admin credentials

## Security Features

- Password hashing with bcrypt
- JWT token authentication for admin routes
- Input validation and sanitization
- CORS protection
- SQL injection prevention

## Email Configuration

The system uses Nodemailer for sending confirmation emails. Configure your SMTP settings in the `.env` file:

- **Gmail**: Use your Gmail address and an App Password
- **Other providers**: Update the SMTP settings accordingly

## Production Deployment

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   - Update database path if needed
   - Configure production email settings
   - Set secure JWT secret

3. **Deploy to your preferred platform**
   - Heroku
   - DigitalOcean
   - AWS
   - VPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support or questions, please contact the Queen Street Gardens management team.

