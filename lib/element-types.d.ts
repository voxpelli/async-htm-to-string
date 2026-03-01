import type { MaybeArray, MaybePromised } from './util-types.d.ts';

export type ElementPropsValue =
  undefined |
  boolean |
  string |
  number |
  unknown[] |
  Record<string, unknown> |
  Set<unknown> |
  Map<unknown, unknown>;

export type ElementProps = {
  [key: string]: ElementPropsValue;
};

export type RenderableElement = string | number | BasicRenderableElement<any>;

export type HtmlMethodResult = MaybePromised<MaybeArray<MaybePromised<BasicRenderableElement<ElementProps> | string>>>;

export type RenderableElementFunction<Props extends ElementProps> = (props: Props, children: RenderableElement[]) => HtmlMethodResult;
export type SimpleRenderableElementFunction = RenderableElementFunction<ElementProps>;

export interface BasicRenderableElement<Props extends ElementProps> {
  type: string | RenderableElementFunction<Props>;
  props: Props;
  children: RenderableElement[];
  /** @internal */
  skipStringEscape?: boolean;
  /** @internal */
  async?: boolean;
}

export interface StringRenderableElement<Props extends ElementProps> extends BasicRenderableElement<Props> {
  type: string;
  skipStringEscape?: never;
}
