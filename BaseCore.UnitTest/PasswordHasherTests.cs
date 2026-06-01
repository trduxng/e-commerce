using BaseCore.Common.Auth;
using NUnit.Framework;

namespace BaseCore.UnitTest
{
    [TestFixture]
    public class PasswordHasherTests
    {
        [Test]
        public void Hash_ProducesSaltedVerifiableHash()
        {
            var firstHash = PasswordHasher.Hash("correct-password");
            var secondHash = PasswordHasher.Hash("correct-password");

            Assert.That(firstHash, Is.Not.EqualTo(secondHash));
            Assert.That(PasswordHasher.Verify("correct-password", firstHash), Is.True);
            Assert.That(PasswordHasher.Verify("wrong-password", firstHash), Is.False);
        }
    }
}
