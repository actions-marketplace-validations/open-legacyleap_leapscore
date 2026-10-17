Imports System.Web
Imports System.Web.UI

Public Class _Default
    Inherits Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As EventArgs) Handles Me.Load
        LedgerLabel.Text = "Order portal"
    End Sub
End Class
