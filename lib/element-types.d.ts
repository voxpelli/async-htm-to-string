import type { MaybeArray } from './util-types.d.ts';

export type ElementPropsValue =
  undefined |
  boolean |
  string |
  number |
   // TODO: Can the values below be set to unknown instead?
  any[] |
  Record<string, any> |
  Set<any> |
  Map<any, any>;

export type ElementProps = {
  [key: string]: ElementPropsValue;
};

export type RenderableElement = string | number | BasicRenderableElement<any>;

// TODO: Where is the asyncness here?!
export type HtmlMethodResult = MaybeArray<BasicRenderableElement<ElementProps> | string>;

// TODO: Where is the asyncness here?!
export type RenderableElementFunction<Props extends ElementProps> = (props: Props, children: RenderableElement[]) => HtmlMethodResult;
export type SimpleRenderableElementFunction = RenderableElementFunction<ElementProps>;

// TODO: Where is the asyncness here?!
export interface BasicRenderableElement<Props extends ElementProps> {
  type: string | RenderableElementFunction<Props>;
  props: Props;
  children: RenderableElement[];
  skipStringEscape?: boolean;
}

export interface StringRenderableElement<Props extends ElementProps> extends BasicRenderableElement<Props> {
  type: string;
  skipStringEscape?: never;
}
