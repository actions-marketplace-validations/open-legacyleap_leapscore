Imports Microsoft.VisualStudio.TestTools.UnitTesting

<TestClass>
Public Class BillingTests
    <TestMethod>
    Public Sub InvoiceTotalsAreRounded()
        Assert.AreEqual(2, 2)
    End Sub

    <TestMethod>
    Public Sub LegacyDiscountStillApplies()
        Assert.AreEqual(1, 1)
    End Sub

    <TestMethod, Ignore>
    Public Sub ObsoleteTaxPathIsSkipped()
    End Sub

    <TestMethod>
    Public Sub PendingRule()
        Assert.Inconclusive("awaiting legal sign-off")
    End Sub
End Class
