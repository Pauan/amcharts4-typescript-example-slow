/**
 * Provides functionality used to creating and showing tooltips (balloons).
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Container, IContainerProperties, IContainerAdapters, IContainerEvents } from "../Container";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { PointedRectangle } from "./PointedRectangle";
import { IPoint } from "../defs/IPoint";
import { Label } from "../elements/Label";
import { Animation } from "../utils/Animation";
import { color } from "../utils/Color";
import { DropShadowFilter } from "../rendering/filters/DropShadowFilter";
import { IRectangle } from "../defs/IRectangle";
import * as $math from "../utils/Math";
import * as $ease from "../utils/Ease";
import * as $utils from "../utils/Utils";
import * as $type from "../utils/Type";

/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Represents options for tooltip pointer (arrow) orientation.
 *
 * @type {string}
 */
export type PointerOrientation = "horizontal" | "vertical";

/**
 * Defines properties for [[Tooltip]].
 */
export interface ITooltipProperties extends IContainerProperties {

	/**
	 * Pointer orientation: "horizontal" or "vertical".
	 *
	 * @default "vertical"
	 * @type {PointerOrientation}
	 */
	pointerOrientation?: PointerOrientation;

	/**
	 * Duration (ms) that takes for a Tooltip to move from one place to another.
	 *
	 * If set to a zero value, the Tooltop will jump to a new location
	 * instantenously.
	 *
	 * If set to a non-zero value, the Tooltip will "glide" to a new location at
	 * a speed determined by this setting.
	 *
	 * @see {@link https://www.amcharts.com/docs/v4/concepts/animations/} for more info about animations
	 * @type {number}
	 */
	animationDuration?: number;

	/**
	 * An easing function to use when animating Tooltip position.
	 *
	 * @see {@link https://www.amcharts.com/docs/v4/concepts/animations/} for more info about animations
	 * @type {(value: number) => number}
	 */
	animationEasing?: (value: number) => number;

	/**
	 * Specifies if tooltip background should get stroke color from the sprite
	 * it is pointing to.
	 *
	 * @type {boolean}
	 */
	getStrokeFromObject?: boolean;

	/**
	 * Specifies if tooltip background should get fill color from the sprite it
	 * is pointing to.
	 *
	 * @type {boolean}
	 */
	getFillFromObject?: boolean;

	/**
	 * Specifies if text color should be chosen automatically for a better
	 * readability.
	 *
	 * @type {boolean}
	 */
	autoTextColor?: boolean;
}

/**
 * Defines events for [[Tooltip]].
 */
export interface ITooltipEvents extends IContainerEvents { }

/**
 * Defines adapters for [[Tooltip]].
 *
 * @see {@link Adapter}
 */
export interface ITooltipAdapters extends IContainerAdapters, ITooltipProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Tooltip displays text and/or multimedia information in a balloon over chart
 * area.
 * @see {@link ITooltipEvents} for a list of available events
 * @see {@link ITooltipAdapters} for a list of available Adapters
 */
export class Tooltip extends Container {

	/**
	 * Defines available properties.
	 *
	 * @type {ITooltipProperties}
	 */
	public _properties!: ITooltipProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {ITooltipAdapters}
	 */
	public _adapter!: ITooltipAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {ITooltipEvents}
	 */
	public _events!: ITooltipEvents;

	/**
	 * A type for the background element.
	 *
	 * @type {PointedRectangle}
	 */
	public _background: PointedRectangle;

	/**
	 * Text element that represents tooltip contents.
	 */
	public label: Label;

	/**
	 * A container that should be considered a "boundary" for the tooltip. A
	 * bounding container is used to calculate numeric boundaries
	 * (`boundingRect`). It is used to constrain the Tooltip to specific area on
	 * the chart, like for example cursor tooltip in plot area.
	 *
	 * @type {Container}
	 */
	protected _boundingContainer: Container;

	/**
	 * Holds numeric boundary values. Calculated from the `boundingContainer`.
	 *
	 * @type {IRectangle}
	 */
	protected _boundingRect: IRectangle = { x: -40000, y: -40000, width: 80000, height: 80000 };

	/**
	 * Coordinates tooltip's pointer (stem) should point to.
	 *
	 * @type {IPoint}
	 */
	protected _pointTo: IPoint = { x: 0, y: 0 };

	/**
	 * If set to `true` the pointer/stem of the Tooltip will not go outside
	 * Tooltip's width or height depending on pointer's orientation.
	 *
	 * @default false
	 * @type {boolean}
	 */
	public fitPointerToBounds: boolean = false;

	/**
	 * If tooltipOrientation is vertical, it can be drawn below or above point. We need to know this when solving overlapping
	 *
	 * @type "up" | "down"
	 */
	protected _verticalOrientation: "up" | "down" = "up";

	/**
	 * Position animation of a tooltip
	 */
	protected _animation: $type.Optional<Animation>;


	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "Tooltip";
		this.isMeasured = false;

		this.getFillFromObject = true;
		this.margin(5, 5, 5, 5);

		// Create chrome/background
		let background = this.background;
		background.interactionsEnabled = false;
		background.fillOpacity = 0.9;
		background.strokeWidth = 1;
		background.strokeOpacity = 1;
		background.stroke = color("#ffffff");
		background.cornerRadius = 3;
		background.pointerLength = 6;
		background.pointerBaseWidth = 10;

		this.autoTextColor = true;

		// Create text element
		let label = this.createChild(Label);
		label.shouldClone = false;
		this.label = label;
		label.padding(7, 12, 6, 12);
		label.interactionsEnabled = false;
		label.horizontalCenter = "middle";
		label.fill = color("#ffffff");
		this._disposers.push(label);

		this.label.events.on("sizechanged", this.drawBackground, this);
		this.label.events.on("positionchanged", this.drawBackground, this);

		this.label.zIndex = 1; // @todo remove this line when bg sorting is solved

		// Set defaults
		this.pointerOrientation = "vertical";

		let dropShadow = new DropShadowFilter();
		dropShadow.dy = 1;
		dropShadow.dx = 1;
		dropShadow.opacity = 0.5;

		this.filters.push(dropShadow);

		this.animationDuration = 0;
		this.animationEasing = $ease.cubicOut;

		// Set accessibility options
		this.role = "tooltip";

		this.visible = false;
		this.opacity = 0;

		this.x = 0;
		this.y = 0;

		this.events.on("visibilitychanged", this.handleVisibility, this);

		// Apply theme
		this.applyTheme();
	}

	protected handleVisibility() {
		if (this.visible) {
			this.label.invalidate();
		}
	}


	/**
	 * Specifies if tooltip background should get stroke color from the sprite it is pointing to.
	 *
	 * @return {boolean}
	 * @default false
	 */
	public get getStrokeFromObject(): boolean {
		return this.getPropertyValue("getStrokeFromObject");
	}

	/**
	 * Specifies if tooltip background should get stroke color from the sprite it is pointing to.
	 *
	 * @param {value} value boolean
	 */
	public set getStrokeFromObject(value: boolean) {
		this.setPropertyValue("getStrokeFromObject", value, true);
	}

	/**
	 * Specifies if text color should be chosen automatically for a better
	 * readability.
	 *
	 * IMPORTANT: this feature is generally ignored, if `getFillFromObject = false`.
	 *
	 * If inheriting of `fill` color from object tooltip is displayed for is
	 * disabled, this feature will not work. If you are explicitly setting a
	 * color for tooltip background, you may set a color for its label as well
	 * using `tooltip.label.fill` property.
	 *
	 *
	 * @param {value} value boolean
	 */
	public set autoTextColor(value: boolean) {
		this.setPropertyValue("autoTextColor", value, true);
	}

	/**
	 * @return {boolean}
	 * @default true
	 */
	public get autoTextColor(): boolean {
		return this.getPropertyValue("autoTextColor");
	}

	/**
	 * Specifies if tooltip background should get fill color from the sprite it is pointing to.
	 *
	 * @return {boolean}
	 * @default true
	 */
	public get getFillFromObject(): boolean {
		return this.getPropertyValue("getFillFromObject");
	}

	/**
	 * @param {value} value boolean
	 */
	public set getFillFromObject(value: boolean) {
		this.setPropertyValue("getFillFromObject", value, true);
	}


	/**
	 * Creates and returns a background element.
	 *
	 * @ignore Exclude from docs
	 * @return {PointedRectangle} Background
	 */
	public createBackground(): this["_background"] {
		return new PointedRectangle();
	}

	/**
	 * Pointer orientation: "horizontal" or "vertical".
	 *
	 * @default "vertical"
	 * @param {PointerOrientation}  value  Orientation
	 */
	public set pointerOrientation(value: PointerOrientation) {
		this.setPropertyValue("pointerOrientation", value, true);
	}

	/**
	 * @return {PointerOrientation} Orientation
	 */
	public get pointerOrientation(): PointerOrientation {
		return this.getPropertyValue("pointerOrientation");
	}

	/**
	 * Duration in milliseconds for the animation to take place when the tooltip
	 * is moving from one place to another.
	 *
	 * @default 0
	 * @param {number}  value  number
	 */
	public set animationDuration(value: number) {
		this.setPropertyValue("animationDuration", value);
	}

	/**
	 * @return {PointerOrientation} Orientation
	 */
	public get animationDuration(): number {
		return this.getPropertyValue("animationDuration");
	}

	/**
	 * Tooltip animation (moving from one place to another) easing function.
	 *
	 * @default $ease.cubicOut
	 * @param {Function}  value (value: number) => number
	 */
	public set animationEasing(value: (value: number) => number) {
		this.setPropertyValue("animationEasing", value);
	}

	/**
	 * @return {Function}
	 */
	public get animationEasing(): (value: number) => number {
		return this.getPropertyValue("animationEasing");
	}

	/**
	 * HTML content for the Tooltip.
	 *
	 * Provided value will be used as is, without applying any further
	 * formatting to it.
	 *
	 * @param {string}  value  HTML content
	 */
	public set html(value: string) {
		if (this.label.html != value) {
			this.label.html = value;
			this.invalidate();
		}
	}

	/**
	 * @return {string} HTML content
	 */
	public get html(): string {
		return this.label.html;
	}

	/**
	 * SVG text content for the Tooltip.
	 *
	 * Text can have a number of formatting options supported by
	 * [[TextFormatter]].
	 *
	 * @param {string}  value  SVG text
	 */
	public set text(value: string) {
		if (this.label.text != value) {
			this.label.text = value;
			this.invalidate();
		}
	}

	/**
	 * @return {string} SVG text
	 */
	public get text(): string {
		return this.label.text;
	}

	/**
	 * Creates the Tooltip.
	 *
	 * @ignore Exclude from docs
	 */
	public draw(): void {
		super.draw();

		let label = this.label;

		if (label.invalid) {
			label.validate();
		}

		let x: number = this._pointTo.x;
		let y: number = this._pointTo.y;

		let boundingRect: IRectangle = this._boundingRect;

		let textW: number = label.measuredWidth;
		let textH: number = label.measuredHeight;

		let pointerLength = this.background.pointerLength;

		let textX: number;
		let textY: number;

		// try to handle if text is wider than br
		if (textW > boundingRect.width) {
			let p0 = $utils.spritePointToDocument({ x: boundingRect.x, y: boundingRect.y }, this.parent);
			let p1 = $utils.spritePointToDocument({ x: boundingRect.x + boundingRect.width, y: boundingRect.y + boundingRect.height }, this.parent);

			let documentWidth = document.body.offsetWidth;
			let documentHeight = document.body.offsetHeight;

			if (p1.x > documentWidth / 2) {
				boundingRect.x = boundingRect.width - textW;
			}
			else {
				boundingRect.width = boundingRect.x + textW;
			}
		}

		// horizontal
		if (this.pointerOrientation == "horizontal") {
			textY = - textH / 2;
			if (x > boundingRect.x + boundingRect.width / 2) {
				textX = - textW / 2 - pointerLength;
			}
			else {
				textX = textW / 2 + pointerLength;
			}
		}
		// vertical pointer
		else {
			textX = $math.fitToRange(0, boundingRect.x - x + textW / 2, boundingRect.x - x + boundingRect.width - textW / 2);

			if (y > boundingRect.y + textH + pointerLength) {
				textY = - textH - pointerLength;
				this._verticalOrientation = "up";
			}
			else {
				textY = pointerLength;
				this._verticalOrientation = "down";
			}
		}

		textY = $math.fitToRange(textY, boundingRect.y - y, boundingRect.y + boundingRect.height - textH - y);

		label.x = textX;
		label.y = textY;
	}

	/**
	 * Overrides functionality from the superclass.
	 *
	 * @ignore Exclude from docs
	 */
	public updateBackground(): void {
		this.group.addToBack(this.background.group);
	}

	/**
	 * Draws Tooltip background (chrome, background and pointer/stem).
	 *
	 * @ignore Exclude from docs
	 */
	public drawBackground(): void {
		let label = this.label;
		let background: PointedRectangle = this.background;

		let textWidth: number = label.measuredWidth;
		let textHeight: number = label.measuredHeight;

		let boundingRect: IRectangle = this._boundingRect;

		let bgWidth: number = textWidth;
		let bgX: number = label.pixelX - textWidth / 2;

		let bgHeight: number = textHeight;
		let bgY: number = label.pixelY;

		let x: number = this._pointTo.x;
		let y: number = this._pointTo.y;

		let boundX1: number = boundingRect.x - x;
		let boundX2: number = boundX1 + boundingRect.width;
		let boundY1: number = boundingRect.y - y;
		let boundY2: number = boundY1 + boundingRect.height;

		background.x = bgX;
		background.y = bgY;

		background.width = bgWidth;
		background.height = bgHeight;

		if (this.fitPointerToBounds) {
			background.pointerX = $math.fitToRange(- background.x, boundX1 - background.x, boundX2 - background.x);
			background.pointerY = $math.fitToRange(- background.y, boundY1 - background.y, boundY2 - background.y);
		}
		else {
			background.pointerX = - background.x;
			background.pointerY = - background.y;
		}

		background.validate();
	}

	/**
	 * Set nes tooltip's anchor point and moves whole tooltip.
	 *
	 * @param {number}  x  X coordinate
	 * @param {number}  y  Y coordinate
	 */
	public pointTo(point: IPoint, instantly?: boolean): void {
		if (this._pointTo.x != point.x || this._pointTo.y != point.y) {
			this._pointTo = point;
			this.invalidate();

			// this helps to avoid strange animation from nowhere on initial show or when balloon was hidden already
			if (!this.visible || instantly) {
				this.moveTo(this._pointTo);
				if (this._animation) {
					this._animation.kill();
				}
			}
			else {
				// helps to avoid flicker on top/left corner
				if (this.pixelX == 0 && this.pixelY == 0) {
					this.moveTo(this._pointTo);
				}
				else {
					if(this._animation){
						this._animation.kill();
					}
					this._animation = new Animation(this, [{ property: "x", to: point.x, from: this.pixelX }, { property: "y", to: point.y, from: this.pixelY }], this.animationDuration, this.animationEasing).start();
				}
			}
		}
	}

	/**
	 * Sets numeric boundaries Tooltip needs to obey (so it does not go outside
	 * specific area).
	 *
	 * @ignore Exclude from docs
	 * @param {IRectangle} rectangle Boundary rectangle
	 */
	public setBounds(rectangle: IRectangle): void {
		let oldRect = this._boundingRect;
		if (oldRect.x != rectangle.x || oldRect.y != rectangle.y || oldRect.width != rectangle.width || oldRect.height != rectangle.height) {
			this._boundingRect = rectangle;
			this.invalidate();
		}
	}

	/**
	 * Sets a [[Container]] instance to be used when calculating numeric
	 * boundaries for the Tooltip.
	 *
	 * @ignore Exclude from docs
	 * @param {Container}  container  Boundary container
	 */
	public set boundingContainer(container: Container) {
		this._boundingContainer = container;
		// TODO remove closures ?
		container.events.on("sizechanged", this.updateBounds, this);
		container.events.on("positionchanged", this.updateBounds, this);
	}

	/**
	 * Updates numeric boundaries for the Tooltip, based on the
	 * `boundingCountrainer`.
	 */
	protected updateBounds(): void {
		let boundingContainer: Container = this._boundingContainer;
		// to global
		let rect: IRectangle = $utils.spriteRectToSvg({
			x: boundingContainer.pixelX,
			y: boundingContainer.pixelY,
			width: boundingContainer.maxWidth,
			height: boundingContainer.maxHeight
		}, boundingContainer);
		this.setBounds(rect);
	}

	/**
	 * If tooltipOrientation is vertical, it can be drawn below or above point.
	 * We need to know this when solving overlapping.
	 *
	 * @ignore Exclude from docs
	 * @return "up" | "down"
	 */
	public get verticalOrientation(): "up" | "down" {
		return this._verticalOrientation;
	}

	/**
	 * To avoid stackoverflow
	 * @ignore
	 */
	public get tooltip(): Tooltip {
		return undefined;
	}
}
