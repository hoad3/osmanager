using System.Security.Cryptography;
using System.Text;

namespace OSManager.Middleware;

public class MiddlewareStorage
{
    private readonly byte[] _key;
    private readonly string _secret;

    public MiddlewareStorage(string secret)
    {
        _secret = secret;
        using var sha = SHA256.Create();
        // _key = sha.ComputeHash(Encoding.UTF8.GetBytes(secret));
        _key = SHA256.HashData(Encoding.UTF8.GetBytes(secret));
    }

    public void EncryptToFile(string filePath, string plainText)
    {
        using var aes = Aes.Create();
        aes.Key = _key;
        aes.GenerateIV(); 
        aes.Mode = CipherMode.CBC;

        var iv = aes.IV;

        using var encryptor = aes.CreateEncryptor(aes.Key, iv);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        {
            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            cs.Write(plainBytes, 0, plainBytes.Length);
        }

        var encryptedBytes = ms.ToArray();
        var finalBytes = new byte[iv.Length + encryptedBytes.Length];
        Buffer.BlockCopy(iv, 0, finalBytes, 0, iv.Length);
        Buffer.BlockCopy(encryptedBytes, 0, finalBytes, iv.Length, encryptedBytes.Length);

        File.WriteAllBytes(filePath, finalBytes);
    }

    public string DecryptFromFile(string filePath)
    {
        var data = File.ReadAllBytes(filePath);

        var iv = new byte[16];
        var encryptedBytes = new byte[data.Length - 16];

        Buffer.BlockCopy(data, 0, iv, 0, 16);
        Buffer.BlockCopy(data, 16, encryptedBytes, 0, encryptedBytes.Length);

        using var aes = Aes.Create();
        aes.Key = _key;
        aes.IV = iv;
        aes.Mode = CipherMode.CBC;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(encryptedBytes);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);

        return sr.ReadToEnd();
    }
    
    public string DecryptFromBase64(string ivBase64, string cipherBase64)
    {
        // Console.WriteLine("DecryptFromBase64: " + base64);
        // byte[] full = Convert.FromBase64String(base64);
        //
        //
        // byte[] iv = full[..16];
        // byte[] cipher = full[16..];
        //
        // using var aes = Aes.Create();
        // aes.KeySize = 256;
        // aes.BlockSize = 128;
        // aes.Mode = CipherMode.CBC;
        // aes.Padding = PaddingMode.PKCS7;
        // // aes.Key = SHA256.HashData(Encoding.UTF8.GetBytes(_secret));
        // aes.Key = _key;
        // aes.IV = iv;
        //
        // using var decryptor = aes.CreateDecryptor();
        // using var ms = new MemoryStream(cipher);
        // using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        // using var result = new MemoryStream();
        // cs.CopyTo(result);
        // Console.WriteLine("Results" +Encoding.UTF8.GetString(result.ToArray()));
        //
        // return Encoding.UTF8.GetString(result.ToArray());
        Console.WriteLine("DecryptFromBase64: " + ivBase64);
        Console.WriteLine("DecryptFromBase64: " + cipherBase64);
        var iv = Convert.FromBase64String(ivBase64);
        var cipher = Convert.FromBase64String(cipherBase64);

        using var aes = Aes.Create();
        aes.Key = _key;
        Console.WriteLine("KeyHex: " + Convert.ToHexString(_key));
        aes.IV = iv;
        Console.WriteLine("iv: " + iv);
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using var decryptor = aes.CreateDecryptor();
        Console.WriteLine("decryptor: " + decryptor);
        using var ms = new MemoryStream(cipher);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs, Encoding.UTF8);

        return sr.ReadToEnd();
    }


}