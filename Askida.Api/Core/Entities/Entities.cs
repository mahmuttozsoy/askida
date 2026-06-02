namespace Askida.Api.Core.Entities
{
    public class User
    {
        public string Id { get; set; } = string.Empty; // For Firebase compatibility
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public bool PhoneVerified { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Student"; // Student, Supporter, Business, Admin
        public string VerificationStatus { get; set; } = "None"; // None, Pending, Verified, Rejected
        public string VerificationDocumentUrl { get; set; } = string.Empty;
        public string StudentCategory { get; set; } = string.Empty; // İlkokul, Ortaokul, Lise, Üniversite
        public string SchoolName { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public string FcmToken { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class Category
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
    }

    public class Aid
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CategoryId { get; set; } = string.Empty;
        public string CreatorId { get; set; } = string.Empty; // Supporter or Business
        public string ClaimerId { get; set; } = string.Empty; // Student who claimed it
        public double Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string Status { get; set; } = "Available"; // Available, Claimed, Completed
        public int Quantity { get; set; } = 1;
        public int RemainingQuantity { get; set; } = 1;
        public string ParentId { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Notification
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
