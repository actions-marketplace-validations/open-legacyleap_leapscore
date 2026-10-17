Imports System.Web
Imports Newtonsoft.Json

Public Class Orders
    Inherits Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As EventArgs) Handles Me.Load
        Dim payload = JsonConvert.SerializeObject(New With {.status = "ok"})
        Response.Write(payload)
    End Sub
End Class
