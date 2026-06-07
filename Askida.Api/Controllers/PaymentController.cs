using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Iyzipay.Request;
using Iyzipay.Model;
using Iyzipay;
using System.Collections.Generic;
using System;

namespace Askida.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        [HttpPost("pay")]
        public async Task<IActionResult> Pay([FromBody] PaymentModel model)
        {
            if (model == null) return BadRequest("Geçersiz veri");

            // Iyzico Ayarları (Test Ortamı)
            Options options = new Options();
            options.ApiKey = "sandbox-API_KEY_BURAYA"; // Kullanıcı kendi test anahtarını yazacak
            options.SecretKey = "sandbox-SECRET_KEY_BURAYA";
            options.BaseUrl = "https://sandbox-api.iyzipay.com";

            // Ödeme İsteği
            CreatePaymentRequest request = new CreatePaymentRequest();
            request.Locale = Locale.TR.ToString();
            request.ConversationId = Guid.NewGuid().ToString();
            request.Price = model.Price.ToString().Replace(",", ".");
            request.PaidPrice = model.Price.ToString().Replace(",", ".");
            request.Currency = Currency.TRY.ToString();
            request.Installment = 1;
            request.BasketId = "DONATION-" + Guid.NewGuid().ToString().Substring(0, 5);
            request.PaymentChannel = PaymentChannel.MOBILE.ToString();
            request.PaymentGroup = PaymentGroup.PRODUCT.ToString(); // Bağış vs.

            // Kredi Kartı
            PaymentCard paymentCard = new PaymentCard();
            paymentCard.CardHolderName = model.CardHolderName;
            paymentCard.CardNumber = model.CardNumber?.Replace(" ", "");
            paymentCard.ExpireMonth = model.ExpireMonth;
            paymentCard.ExpireYear = model.ExpireYear;
            paymentCard.Cvc = model.Cvc;
            paymentCard.RegisterCard = 0;
            request.PaymentCard = paymentCard;

            // Alıcı (Zorunlu)
            Buyer buyer = new Buyer();
            buyer.Id = "BY789";
            buyer.Name = "Askida";
            buyer.Surname = "Destekci";
            buyer.GsmNumber = "+905324000000";
            buyer.Email = "email@email.com";
            buyer.IdentityNumber = "74300864791";
            buyer.LastLoginDate = "2015-10-05 12:43:35";
            buyer.RegistrationDate = "2013-04-21 15:12:09";
            buyer.RegistrationAddress = "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1";
            buyer.Ip = "85.34.78.112";
            buyer.City = "Istanbul";
            buyer.Country = "Turkey";
            buyer.ZipCode = "34732";
            request.Buyer = buyer;

            // Fatura Adresi (Zorunlu)
            Address billingAddress = new Address();
            billingAddress.ContactName = "Askida Destekci";
            billingAddress.City = "Istanbul";
            billingAddress.Country = "Turkey";
            billingAddress.Description = "Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1";
            billingAddress.ZipCode = "34732";
            request.BillingAddress = billingAddress;

            // Teslimat Adresi (Zorunlu)
            Address shippingAddress = new Address();
            shippingAddress.ContactName = "Askida Talep Eden";
            shippingAddress.City = "Istanbul";
            shippingAddress.Country = "Turkey";
            shippingAddress.Description = "Askida Sistem Teslimati";
            shippingAddress.ZipCode = "34732";
            request.ShippingAddress = shippingAddress;

            // Sepet İçeriği (Zorunlu)
            List<BasketItem> basketItems = new List<BasketItem>();
            BasketItem firstBasketItem = new BasketItem();
            firstBasketItem.Id = "BI101";
            firstBasketItem.Name = model.AdTitle ?? "Bağış";
            firstBasketItem.Category1 = "Donation";
            firstBasketItem.ItemType = BasketItemType.VIRTUAL.ToString();
            firstBasketItem.Price = model.Price.ToString().Replace(",", ".");
            basketItems.Add(firstBasketItem);
            request.BasketItems = basketItems;

            // Iyzico'ya gönder
            Payment payment = await Payment.Create(request, options);

            if (payment.Status == "success")
            {
                return Ok(new { success = true, transactionId = payment.PaymentId });
            }
            else
            {
                return BadRequest(new { success = false, message = payment.ErrorMessage });
            }
        }
    }

    public class PaymentModel
    {
        public string? CardHolderName { get; set; }
        public string? CardNumber { get; set; }
        public string? ExpireMonth { get; set; }
        public string? ExpireYear { get; set; }
        public string? Cvc { get; set; }
        public double Price { get; set; }
        public string? AdTitle { get; set; }
    }
}
