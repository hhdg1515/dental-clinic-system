 rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // 允许认证用户读写自己的数据
      match /users/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      // 临时开放管理相关数据（仅用于测试）
      match /appointments/{appointmentId} {
        allow read, write: if true;
      }

      match /cancelledAppointments/{path=**} {
        allow read, write: if true;
      }

      match /pendingConfirmations/{confirmationId} {
        allow read, write: if true;
      }

      match /patientProfiles/{patientId} {
        allow read, write: if true;
      }

      // Medical Records rules - 允许所有认证用户访问（管理员权限）
      match /medicalRecords/{recordId} {
        allow read, write, delete, create: if true;
      }
    }
  }