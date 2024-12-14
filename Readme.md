# Resume Builder (Clone of Resume.io)

A web application that allows users to create professional resumes effortlessly. Users can log in using their Gmail accounts, choose from a variety of pre-designed templates, and customize their resumes to suit their needs.

---

## Features

- **User Authentication**: Log in using your Gmail account for a seamless experience.
- **Template Selection**: Choose from multiple professionally designed templates.
- **Customization**: Personalize your resume to reflect your style and needs.
- **Create Your Own Templates**: Design and contribute your templates to the platform by raising a pull request (PR).

---

## Tech Stack

- **Frontend**: React.js for building a responsive and user-friendly interface.
- **Database**: Firebase Firestore for secure data storage.
- **Hosting**: Deployed on Netlify for fast and reliable access.

---

## Getting Started

Follow the steps below to set up the project locally:

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14.x or later)
- [Firebase CLI](https://firebase.google.com/docs/cli)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/resume-builder.git
   cd resume-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
   - Copy your Firebase configuration and create a `.env` file in the project root:
     ```env
     REACT_APP_API_KEY=YOUR_API_KEY
     REACT_APP_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
     REACT_APP_PROJECT_ID=YOUR_PROJECT_ID
     REACT_APP_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
     REACT_APP_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
     REACT_APP_APP_ID=YOUR_APP_ID
     ```

4. Start the development server:
   ```bash
   npm start
   ```

Access the app at `http://localhost:3000`.

---

## Deployment

To deploy the app on Netlify:

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to Netlify using the Netlify CLI or the Netlify dashboard.

---

## Contribution

Contributions are welcome! If you'd like to contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/new-template
   ```
3. Make your changes and commit them:
   ```bash
   git commit -m "Added a new resume template"
   ```
4. Push your branch:
   ```bash
   git push origin feature/new-template
   ```
5. Open a pull request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Feel free to explore, create, and contribute to the project!
