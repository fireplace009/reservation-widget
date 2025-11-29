# Reservation Widget Project

```text
       .---------------------------------.
       |      RESERVATION WIDGET         |
       |                                 |
       |   Date:    [ 2025-11-29 ]       |
       |   Time:    [ 19:00 v ]          |
       |   Guests:  [ 2      ]           |
       |                                 |
       |   Name:    [ John Doe      ]    |
       |   Email:   [ john@test.com ]    |
       |                                 |
       |        .---------------.        |
       |        |  CONFIRM      |        |
       |        '---------------'        |
       '---------------------------------'
```

## Overview

This project is a comprehensive restaurant reservation system built using **Lit** web components and **Firebase**. It provides a seamless experience for both customers and restaurant administrators.

## Features

### Public Reservation Widget (`<reservation-widget>`)
-   **Real-time Availability**: Checks for available timeslots against configured capacity.
-   **Smart Validation**: Prevents booking on closed days or fully booked slots.
-   **User-Friendly Form**: Collects guest details (Name, Email, Phone, Special Requests).
-   **Email Confirmation**: Sends automated confirmation emails upon successful booking.

### Admin Dashboard (`<admin-dashboard>`)
-   **Authentication**: Secure login via Google Auth.
-   **Reservation Management**: View, edit, and cancel reservations.
-   **Calendar Heatmap**: Visual overview of occupancy per day (Green -> Red).
-   **Timeslot Management**:
    -   **Heatmap View**: Detailed view of slots for a selected day.
    -   **Blocking**: Block specific timeslots or entire days (e.g., for private events).
    -   **Drag-to-Select**: Easily select multiple timeslots to block/unblock in bulk.
-   **Data Grid**: Sortable and filterable list of reservations.

## Tech Stack
-   **Frontend**: Lit (Web Components), Vite
-   **Backend/Database**: Firebase (Firestore, Auth, Functions)
-   **Build Tool**: Vite
-   **CI/CD**: GitHub Actions

## Setup
1.  Install dependencies: `npm install`
2.  Run development server: `npm run dev`
3.  Build for production: `npm run build`
