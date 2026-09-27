export interface ButtonItem {
  buttonId: string;
  buttonText: {
    displayText: string;
  };
  type?: number;
}

export interface OptionRow {
  id?: string;
  rowId?: string;
  title: string;
  description?: string;
}

export interface OptionSection {
  title: string;
  rows: OptionRow[];
}

export interface CtaCopyButtonParams {
  id?: string;
  display_text: string;
  copy_code: string;
}

export interface CtaUrlButtonParams {
  display_text: string;
  url: string;
  merchant_url?: string;
}

export interface CtaCallButtonParams {
  display_text: string;
  phone_number: string;
}

export interface SingleSelectRow {
  id: string;
  title: string;
  description?: string;
}

export interface SingleSelectSection {
  title: string;
  rows: SingleSelectRow[];
}

export interface SingleSelectButtonParams {
  title: string;
  sections: SingleSelectSection[];
}

export interface QuickReplyButton {
  index?: number;
  quickReplyButton: {
    displayText: string;
    id: string;
  };
}

export interface UrlButton {
  index?: number;
  urlButton: {
    displayText: string;
    url: string;
  };
}

export interface CallButton {
  index?: number;
  callButton: {
    displayText: string;
    phoneNumber: string;
  };
}

export interface NativeFlowButton<TParams = unknown> {
  name: string;
  buttonParamsJson: string | TParams;
}

export interface InteractiveResponseParams {
  id?: string;
  row_id?: string;
  selected_id?: string;
  [key: string]: unknown;
}

declare global {
  type ButtonItemGlobal = ButtonItem;
  type OptionRowGlobal = OptionRow;
  type OptionSectionGlobal = OptionSection;
  type NativeFlowButtonGlobal<TParams = unknown> = NativeFlowButton<TParams>;
}
