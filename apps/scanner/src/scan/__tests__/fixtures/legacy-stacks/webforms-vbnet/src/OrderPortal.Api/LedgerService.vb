Imports Serilog
Imports Dapper
Imports log4net

Public Class LedgerService
    Private ReadOnly _log As ILog = LogManager.GetLogger(GetType(LedgerService))

    Public Function LoadLedger(ByVal connectionString As String) As IEnumerable(Of Object)
        _log.Info("loading ledger entries")
        Using connection As New SqlConnection(connectionString)
            Return connection.Query(Of Object)("select * from LedgerEntries")
        End Using
    End Function
End Class
