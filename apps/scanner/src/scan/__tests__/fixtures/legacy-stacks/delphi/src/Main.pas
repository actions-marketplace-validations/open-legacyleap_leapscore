unit Main;

interface

uses
  Winapi.Windows, Vcl.Forms, Vcl.Dialogs;

type
  TMainForm = class(TForm)
    procedure FormCreate(Sender: TObject);
  end;

var
  MainForm: TMainForm;

implementation

procedure TMainForm.FormCreate(Sender: TObject);
begin
  Caption := 'Order Entry';
end;

end.
