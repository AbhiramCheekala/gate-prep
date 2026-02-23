# GATE Exam Preparation Platform

A full-stack GATE preparation platform built with Next.js 14, Drizzle ORM, and MySQL.

## Features
- **Student Portal**: Take tests, view history, analyze performance, and review mistakes.
- **Admin Portal**: Manage question bank, upload questions via JSON, build tests, and track student performance.
- **GATE-style UI**: Pixel-accurate test-taking interface matching the official GATE exam environment.
- **Dynamic Question Types**: Support for Multiple Choice (MCQ), Multiple Select (MSQ), and Numerical Answer Type (NAT) questions.
- **Scoring Logic**: Automatic score calculation with negative marking for MCQs.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: MySQL 8+
- **ORM**: Drizzle ORM
- **Auth**: iron-session (Session-based)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Validation**: Zod

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Configuration**:
   - Create a MySQL database.
   - Copy `.env.example` to `.env` and update `DATABASE_URL` and `SESSION_SECRET`.

3. **Database Setup**:
   ```bash
   npm run db:push
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Usage
- **Login**: Use `/login` for both students and admins.
- **Student Dashboard**: `/student/dashboard`
- **Admin Dashboard**: `/admin/dashboard`
- **Bulk Upload**: Admin → Question Bank → Bulk Upload. Use the provided JSON format.

## Math Equations
To render math equations in questions, this platform supports **KaTeX**. Wrap your equations in `$` for inline or `$$` for block display (Note: Implementation requires adding KaTeX CSS and a markdown parser, which can be easily added to `QuestionPanel`).

---

Developed for GATE Exam Aspirants.
