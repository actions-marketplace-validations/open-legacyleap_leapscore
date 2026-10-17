program OrderEntry;

uses
  Vcl.Forms,
  Main in 'Main.pas' {MainForm},
  Orders in 'Orders.pas';

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TMainForm, MainForm);
  Application.Run;
end.
