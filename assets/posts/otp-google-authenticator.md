---
{
  "title": "Google Authenticator One Time Password",
  "timestamp": 1673804612000,
  "tags": ["java", "MFA", "2FA"]
}
---

You are probably using the [Google Authenticator](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2) app for yours 2FA/MFA sites.

The code for generating and validating the OTP code is really simple.

```java
public static int generateGoogleOneTimePassword(final byte[] key, final long counter)
      throws NoSuchAlgorithmException, InvalidKeyException {
  final Mac hmac = Mac.getInstance("HmacSHA1");
  hmac.init(new SecretKeySpec(key, "HmacSHA1"));
  final ByteBuffer data = ByteBuffer.allocate(8);
  data.putLong(counter);
  final byte[] hmacHash = hmac.doFinal(data.array());

  final int offset = hmacHash[hmacHash.length - 1] & 0x0f;
  final int hotp = (hmacHash[offset] & 0x7f) << 24
                  | (hmacHash[1 + offset] & 0xff) << 16
                  | (hmacHash[2 + offset] & 0xff) << 8
                  | (hmacHash[3 + offset] & 0xff);
  return hotp % 1_000_000;
}

public static int generateGoogleTimeBasedOneTimePassword(final byte[] key)
    throws InvalidKeyException, NoSuchAlgorithmException {
  final long interval = (System.currentTimeMillis() / 1000) / 30; // 30sec window
  return generateGoogleOneTimePassword(key, interval);
}
```

Google Authenticator wants a key encoded as Base32, you can use this dummy implementation for printing your key.
```java
private static final char[] BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();
public static String encode32(final byte[] buf) {
  final StringBuilder result = new StringBuilder();

  int vBits = 0;
  int value = 0;
  for (int i = 0; i < buf.length; ++i) {
    value = (value << 8) | (buf[i] & 0xff);
    vBits += 8;
    while (vBits >= 5) {
      result.append(BASE32_ALPHABET[(value >>> (vBits - 5)) & 31]);
      vBits -= 5;
    }
  }

  if (vBits > 0) {
    result.append(BASE32_ALPHABET[(value << (5 - vBits)) & 31]);
  }
  return result.toString();
}
```

And now you can run your main, and watch authenticator and the system out generating the same value.
```java
public static void main(final String[] args) throws Exception {
  final byte[] key = { 'T', 'e', 's', 't', 'K', 'e', 'Y', 'W', 'o', 'w' };
  System.out.println(encode32(key)); // KRSXG5CLMVMVO33X

  while (true) {
    System.out.println(generateGoogleTimeBasedOneTimePassword(key));
    Thread.sleep(1000);
  }
}
```