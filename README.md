# exam_seat_finder
A MongoDB-based web system that automates exam seating generation for administrators and enables students to instantly find their allotted exam hall.

## Administration Features

- Add a range of roll numbers by branch, year, room, and location from the admin interface.
- Preview uploads to detect duplicates or conflicting entries before committing them.
- **New:** clear all records (`POST /api/seats/clear`) or clear entries for a specific room (optionally filtered by branch/year) using the admin UI buttons.

