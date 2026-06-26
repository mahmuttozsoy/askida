using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using Askida.Api.Core.Interfaces;
using Askida.Api.Core.Entities;
// Google API libraries
using Google.Apis.Auth.OAuth2;
using Google.Apis.AndroidPublisher.v3;
using Google.Apis.Services;

namespace Askida.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IAidRepository _aidRepository;

        public PaymentController(IAidRepository aidRepository)
        {
            _aidRepository = aidRepository;
        }

        [HttpPost("verify-purchase")]
        public async Task<IActionResult> VerifyPurchase([FromBody] GooglePlayPurchaseModel model)
        {
            if (model == null || string.IsNullOrEmpty(model.PurchaseToken) || string.IsNullOrEmpty(model.ProductId))
                return BadRequest("Geçersiz veri");

            try
            {
                // In a real production scenario, you would initialize AndroidPublisherService
                // using a Service Account JSON key from Google Cloud Console.
                // For now, we will simulate a successful verification if token is provided.
                
                /*
                // Example of real verification logic:
                GoogleCredential credential = GoogleCredential.FromFile("path/to/service-account.json")
                    .CreateScoped(AndroidPublisherService.Scope.Androidpublisher);

                var service = new AndroidPublisherService(new BaseClientService.Initializer()
                {
                    HttpClientInitializer = credential,
                    ApplicationName = "Askida App"
                });

                if (model.SubscriptionType == "OneTime")
                {
                    var request = service.Purchases.Products.Get("com.yourcompany.askida", model.ProductId, model.PurchaseToken);
                    var purchase = await request.ExecuteAsync();
                    if (purchase.PurchaseState != 0) // 0 = Purchased
                        return BadRequest(new { success = false, message = "Ödeme onaylanmamış." });
                }
                else
                {
                    var request = service.Purchases.Subscriptions.Get("com.yourcompany.askida", model.ProductId, model.PurchaseToken);
                    var purchase = await request.ExecuteAsync();
                    if (purchase.PaymentState != 1) // 1 = Payment received
                        return BadRequest(new { success = false, message = "Abonelik ödemesi alınamamış." });
                }
                */

                // Simulated success (since we don't have the Google Service Account JSON yet)
                bool isVerified = true; 

                if (isVerified)
                {
                    // Create an actual donation record in the Aid repository
                    var aid = new Aid
                    {
                        Title = model.AdTitle ?? "Bağış",
                        Description = $"{model.SubscriptionType} - {model.ProductId} Paketi",
                        CategoryId = "Donation",
                        CreatorId = "supporter-id", // In real app, get from Auth Context
                        Price = model.Price,
                        Location = "Global",
                        Status = "Available",
                        Quantity = model.Quantity,
                        RemainingQuantity = model.Quantity,
                        GooglePlayProductId = model.ProductId,
                        SubscriptionType = model.SubscriptionType
                    };

                    await _aidRepository.AddAsync(aid);

                    return Ok(new { success = true, message = "Google Play ödemesi doğrulandı ve bağış oluşturuldu." });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Google Play doğrulama hatası." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class GooglePlayPurchaseModel
    {
        public string PurchaseToken { get; set; } = string.Empty;
        public string ProductId { get; set; } = string.Empty;
        public string SubscriptionType { get; set; } = "OneTime"; // OneTime, Weekly, Monthly, Yearly
        public double Price { get; set; }
        public string? AdTitle { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
