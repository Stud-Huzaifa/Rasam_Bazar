# Role Permission Matrix

| Capability                   | Customer            | Wedding Owner | Family Member | Vendor Owner       | Vendor Staff       | Support Officer | Admin            |
| ---------------------------- | ------------------- | ------------- | ------------- | ------------------ | ------------------ | --------------- | ---------------- |
| Register/login               | Yes                 | Yes           | Yes           | Yes                | Yes                | Yes             | Yes              |
| Create wedding               | Yes                 | Yes           | No            | No                 | No                 | No              | No               |
| Manage wedding events        | Owner/member scoped | Yes           | Role scoped   | No                 | No                 | No              | Admin audit only |
| Manage guests/budget/tasks   | Owner/member scoped | Yes           | Role scoped   | No                 | No                 | No              | Admin audit only |
| Browse marketplace           | Yes                 | Yes           | Yes           | Yes                | Yes                | Yes             | Yes              |
| Create service request       | Yes                 | Yes           | Role scoped   | No                 | No                 | No              | View only        |
| Submit proposals             | No                  | No            | No            | Yes                | Yes                | No              | View only        |
| Manage vendor profile        | No                  | No            | No            | Yes                | Yes                | No              | Moderate         |
| Manage bookings/payments     | Own records         | Own records   | Role scoped   | Own vendor         | Own vendor         | Support         | All              |
| Messaging                    | Own threads         | Own threads   | Own threads   | Own vendor threads | Own vendor threads | Support         | Audit            |
| Reviews/disputes             | Own bookings        | Own bookings  | No            | Respond            | Respond            | Moderate        | Moderate         |
| User suspension              | No                  | No            | No            | No                 | No                 | Yes             | Yes              |
| Vendor verification approval | No                  | No            | No            | Submit only        | Submit only        | Yes             | Yes              |
| Audit logs                   | No                  | No            | No            | No                 | No                 | Yes             | Yes              |
