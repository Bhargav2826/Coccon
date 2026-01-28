# Secure S (COCOON) 🛡️

**Secure S** (internally known as COCOON) is a premium full-stack MERN application designed to facilitate secure and transparent communication between students and faculty. The platform prioritizes emotional safety and digital protection by providing specialized monitoring tools for parents.

## 🚀 Key Features

- **Real-time Communication**: Seamless real-time chat powered by Socket.io and high-quality Video/Voice calls integrated via LiveKit.
- **Role-Based Dashboards**: 
  - **Student Dashboard**: Intuitive interface for learning and communication.
  - **Faculty Dashboard**: Specialized tools for managing student interactions.
  - **Parent Dashboard**: A dedicated "Authorized Vault" for monitoring communication summaries, ensuring child safety without compromising privacy.
- **AI-Powered Summaries**: Automatic generation of communication transcripts and summaries (Video, Voice, and Chat) to provide insights into student-faculty interactions.
- **Advanced Security**: 
  - Robust **Authentication** using JWT and HttpOnly cookies.
  - Comprehensive **Content Security Policy (CSP)** and Helmet integration.
  - **Rate Limiting** to prevent brute-force attacks.
- **Modern UI/UX**: A responsive, premium interface built with React and custom CSS, featuring dark mode and glassmorphism aesthetics.

## 🛠️ Tech Stack

- **Frontend**: React.js, TailwindCSS/Vanilla CSS, Vite.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **Embedded Services**: 
  - **LiveKit**: For low-latency video and voice streaming.
  - **Deepgram**: For real-time speech-to-text transcription.
  - **Socket.io**: For instant messaging and signaling.
  - **Cloudinary**: For secure image and profile picture storage.

## 🛡️ Security Implementations

- **Data Protection**: Industry-standard encryption for sensitive user data.
- **Secure Communication**: End-to-end signaling for calls.
- **Environment Management**: Strict separation of development and production configurations.

---

*Built with a focus on Emotional Safety & Digital Protection.*
