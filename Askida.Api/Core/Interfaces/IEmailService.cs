using System.Threading.Tasks;

namespace Askida.Api.Core.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);
}
