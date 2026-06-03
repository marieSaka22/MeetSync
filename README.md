# MeetSync — Meeting Scheduling & Reminder System

MeetSync is a web-based meeting scheduling and reminder application developed using a Java-based web architecture.

The system allows users to create personal accounts, log in, and manage their own meetings and schedules. Each user has a separate calendar and can only access their own saved meetings.

The application is built with a Java Servlet-based backend architecture using Spring Boot. Spring Boot runs on an embedded Apache Tomcat application server and uses DispatcherServlet internally to process HTTP requests.

---

## Technology Stack

### Backend
- Java
- Spring Boot
- Servlet-based web architecture (Spring DispatcherServlet)
- Apache Tomcat Application Server
- Spring MVC
- Spring Security
- JWT Authentication
- Hibernate / JPA
- MySQL Database

### Frontend
- HTML
- CSS
- JavaScript
- FullCalendar Library

### Development Tools
- IntelliJ IDEA
- Maven
- phpMyAdmin

---

## Architecture

The application follows the structure:

```text
HTML / CSS / JavaScript Frontend
              |
              |
        HTTP Requests
              |
              |
Spring DispatcherServlet (Servlet Layer)
              |
              |
Spring Controllers
              |
              |
Service Layer
              |
              |
Hibernate / JPA
              |
              |
MySQL Database
```

Spring Boot provides the Java application server environment through embedded Apache Tomcat.

---

## Main Features

### User Management

- User registration
- User login/logout
- Password encryption
- JWT based authentication
- Separate calendar for each user

---

### Meeting Management

Users can:

- Create meetings
- View saved meetings
- Update meeting information
- Delete meetings
- Search meetings
- Display upcoming meetings

Meeting information includes:

- Title
- Description
- Location
- Start time
- End time
- Status
- Color category

---

### Calendar Interface

The system provides a modern calendar interface using FullCalendar.

Supported views:

- Monthly calendar
- Weekly schedule
- Daily schedule

---

### Reminder System

MeetSync includes an automatic reminder feature.

The system:

- Creates reminders for meetings
- Checks pending reminders automatically
- Displays reminder notifications

Implemented using Spring scheduling.

---

### Conflict Detection

Before saving a meeting, the application checks whether the selected time conflicts with existing meetings.

If another meeting already exists at the same time, the system prevents double booking.

---

## Database

The application uses MySQL.

Main database entities:

### users

Stores account information:

- username
- email
- encrypted password
- user role

---

### meetings

Stores meeting data:

- meeting details
- date and time
- organizer information

Each meeting belongs to a specific user.

---

### reminders

Stores meeting reminder information.

---

### meeting_participants

Stores meeting participant relationships.

---

## Security

The application includes:

- Spring Security configuration
- JWT tokens
- Password hashing
- Protected user data

Users can only access their own meetings.

---

## How to Run

1. Clone the project

```bash
git clone <repository-url>
```

2. Open the project in IntelliJ IDEA

3. Configure MySQL connection in:

```text
application.properties
```

4. Start the Spring Boot application

5. Open:

```text
http://localhost:8080
```

---

## Testing Scenario

1. Create a new user account.
2. Login with the created account.
3. Create a meeting.
4. Logout.
5. Login again.
6. Previously saved meetings are displayed.
7. Create another user account.
8. Verify that each user has an independent calendar.

---

## Author

Mariam Sakandelidze

## Special thanks to
AIs(chatgpt codex, claude, perpex)