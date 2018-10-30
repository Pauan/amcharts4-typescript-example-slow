/**
 * Functionality for drawing a trapezoid.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Sprite, ISpriteProperties, ISpriteAdapters, ISpriteEvents, SpriteEventDispatcher, AMEvent } from "../Sprite";
import { Percent, percent } from "../../core/utils/Percent";
import { registry } from "../Registry";
import * as $utils from "../utils/Utils";
import * as $type from "../utils/Type";
import * as $path from "../rendering/Path";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[Trapezoid]].
 */
export interface ITrapezoidProperties extends ISpriteProperties {

	/**
	 * Wdith of the top side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @type {number | Percent}
	 */
	topSide?: number | Percent;

	/**
	 * Wdith of the bottom side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @type {number | Percent}
	 */
	bottomSide?: number | Percent;

	/**
	 * Height of the left side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @type {number | Percent}
	 */
	leftSide?: number | Percent;

	/**
	 * Height of the right side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @type {number | Percent}
	 */
	rightSide?: number | Percent;

	/**
	 * A relative vertical position of the "neck". If the top and bottom sides
	 * are of different width, and `horizontalNeck` is set, a choke point
	 * will be created at that position, creating a funnel shape.
	 *
	 * @type {Percent}
	 */
	horizontalNeck?: Percent;

	/**
	 * A relative horizontal position of the "neck". If the left and right sides
	 * are of different height, and `verticalNeck` is set, a choke point
	 * will be created at that position, creating a funnel shape.
	 *
	 * @type {Percent}
	 */
	verticalNeck?: Percent;

}

/**
 * Defines events for [[Trapezoid]].
 */
export interface ITrapezoidEvents extends ISpriteEvents { }

/**
 * Defines adapters for [[Trapezoid]].
 *
 * @see {@link Adapter}
 */
export interface ITrapezoidAdapters extends ISpriteAdapters, ITrapezoidProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Used to draw a Trapezoid.
 *
 * @see {@link ITrapezoidEvents} for a list of available events
 * @see {@link ITrapezoidAdapters} for a list of available Adapters
 */
export class Trapezoid extends Sprite {

	/**
	 * Defines available properties.
	 *
	 * @type {ITrapezoidProperties}
	 */
	public _properties!: ITrapezoidProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {ITrapezoidAdapters}
	 */
	public _adapter!: ITrapezoidAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {ITrapezoidEvents}
	 */
	public _events!: ITrapezoidEvents;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "Trapezoid";
		this.element = this.paper.add("path");

		this.topSide = percent(100);
		this.bottomSide = percent(100);
		this.leftSide = percent(100);
		this.rightSide = percent(100);

		this.isMeasured = false; // todo: add measureElement
		this.applyTheme();
	}

	/**
	 * Draws the element.
	 *
	 * @ignore Exclude from docs
	 */
	public draw(): void {
		super.draw();
		let w: number = this.pixelWidth;
		let h: number = this.pixelHeight;

		let ts: number = $utils.relativeToValue(this.topSide, w);
		let bs: number = $utils.relativeToValue(this.bottomSide, w);
		let ls: number = $utils.relativeToValue(this.leftSide, h);
		let rs: number = $utils.relativeToValue(this.rightSide, h);

		// 1----2
		// |    |
		// 4----3

		let x0: number = (w - ts) / 2;
		let y0: number = (h - ls) / 2;

		let x1: number = w - (w - ts) / 2;
		let y1: number = (h - rs) / 2;

		let x2: number = w - (w - bs) / 2;
		let y2: number = h - (h - rs) / 2;

		let x3: number = (w - bs) / 2;
		let y3: number = h - (h - ls) / 2;

		let mt: string = "";
		let mr: string = "";
		let mb: string = "";
		let ml: string = "";

		if ($type.hasValue(this.horizontalNeck)) {
			let hn: number = this.horizontalNeck.value;
			mt = $path.lineTo({ x: w * hn, y: Math.max(y0, y1) });
			mb = $path.lineTo({ x: w * hn, y: Math.min(y2, y3) });
		}

		if ($type.hasValue(this.verticalNeck)) {
			let vn: number = this.verticalNeck.value;
			mr = $path.lineTo({ x: Math.min(x1, x2), y: h * vn });
			ml = $path.lineTo({ x: Math.max(x0, x3), y: h * vn });
		}


		let path: string = $path.moveTo({ x: x0, y: y0 })
			+ mt
			+ $path.lineTo({ x: x1, y: y1 })
			+ mr
			+ $path.lineTo({ x: x2, y: y2 })
			+ mb
			+ $path.lineTo({ x: x3, y: y3 })
			+ ml
		this.path = path;
	}

	/**
	 * Wdith of the top side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @param {number | Percent}  value  Width
	 */
	public set topSide(value: number | Percent) {
		this.setPropertyValue("topSide", value, true);
	}

	/**
	 * @return {number} Width
	 */
	public get topSide(): number | Percent {
		return this.getPropertyValue("topSide");
	}

	/**
	 * Wdith of the bottom side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @param {number | Percent}  value  Width
	 */
	public set bottomSide(value: number | Percent) {
		this.setPropertyValue("bottomSide", value, true);
	}

	/**
	 * @return {number} Width
	 */
	public get bottomSide(): number | Percent {
		return this.getPropertyValue("bottomSide");
	}

	/**
	 * Height of the left side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @param {number | Percent}  value  Height
	 */
	public set leftSide(value: number | Percent) {
		this.setPropertyValue("leftSide", value, true);
	}

	/**
	 * @return {number} Height
	 */
	public get leftSide(): number | Percent {
		return this.getPropertyValue("leftSide");
	}

	/**
	 * Height of the right side. Absolute (px) or relative ([[Percent]]).
	 *
	 * @default Percent(100)
	 * @param {number | Percent}  value  Height
	 */
	public set rightSide(value: number | Percent) {
		this.setPropertyValue("rightSide", value, true);
	}

	/**
	 * @return {number} Height
	 */
	public get rightSide(): number | Percent {
		return this.getPropertyValue("rightSide");
	}

	/**
	 * A relative vertical position of the "neck". If the top and bottom sides
	 * are of different width, and `horizontalNeck` is set, a choke point
	 * will be created at that position, creating a funnel shape.
	 *
	 * @param {Percent}  value  Horizontal neck position
	 */
	public set horizontalNeck(value: Percent) {
		this.setPropertyValue("horizontalNeck", value, true);
	}

	/**
	 * @return {Percent} Horizontal neck position
	 */
	public get horizontalNeck(): Percent {
		return this.getPropertyValue("horizontalNeck");
	}

	/**
	 * A relative horizontal position of the "neck". If the left and right sides
	 * are of different height, and `verticalNeck` is set, a choke point
	 * will be created at that position, creating a funnel shape.
	 *
	 * @param {Percent}  value  Vertical neck position
	 */
	public set verticalNeck(value: Percent) {
		this.setPropertyValue("verticalNeck", value, true);
	}

	/**
	 * @return {Percent} Vertical neck position
	 */
	public get verticalNeck(): Percent {
		return this.getPropertyValue("verticalNeck");
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["Trapezoid"] = Trapezoid;
