namespace Askida.Api.Infrastructure.Services;

public static class PhoneNormalizer
{
    public static string? Normalize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
        {
            return null;
        }

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length == 0)
        {
            return null;
        }

        if (digits.StartsWith("0") && digits.Length == 11)
        {
            digits = "90" + digits[1..];
        }
        else if (digits.Length == 10 && digits.StartsWith('5'))
        {
            digits = "90" + digits;
        }

        return digits.Length >= 10 ? digits : null;
    }
}
