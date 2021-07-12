import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import _ from "lodash";
import { commands, Location, Position, Selection } from "vscode";
import { VSCodeUtils } from "../utils";
// import vscode from "vscode";

type CommandOpts = {
  location: Location;
  text: string;
};

type CommandOutput = void;

export class ConvertLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONVERT_LINK.key;

  async gatherInputs(_opts: CommandOpts): Promise<CommandOpts> {
    return _opts;
  }

  async execute(_opts: CommandOpts) {
    const ctx = "ConvertLinkCommand";
    ctx;
    const { location, text } = _opts;
    await commands.executeCommand("vscode.open", location.uri);
    const editor = VSCodeUtils.getActiveTextEditor()!;
    const selection = editor.document.getText(location.range);
    const preConversionOffset = selection.indexOf(text);
    const convertedSelection = selection.replace(text, `\[\[${text}\]\]`);
    await editor.edit((editBuilder) => {
      editBuilder.replace(location.range, convertedSelection);
    });
    const postConversionSelectionRange = new Selection(
      new Position(
        location.range.start.line,
        location.range.start.character + preConversionOffset
      ),
      new Position(
        location.range.end.line,
        location.range.start.character + preConversionOffset + text.length + 4
      )
    );
    editor.selection = postConversionSelectionRange;
    return;
  }
}