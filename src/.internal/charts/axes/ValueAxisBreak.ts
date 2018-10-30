/**
 * A module which defines functionality related to Value Axis Break.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */

import { AxisBreak, IAxisBreakProperties, IAxisBreakAdapters, IAxisBreakEvents } from "./AxisBreak";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { ValueAxis } from "./ValueAxis";
import { IDisposer, MutableValueDisposer } from "../../core/utils/Disposer";
import { registry } from "../../core/Registry";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[ValueAxisBreak]].
 */
export interface IValueAxisBreakProperties extends IAxisBreakProperties {

	/**
	 * Value break starts on.
	 *
	 * @type {number}
	 */
	startValue?: number;

	/**
	 * Value break ends on.
	 *
	 * @type {number}
	 */
	endValue?: number;

}

/**
 * Defines events for [[ValueAxisBreak]].
 */
export interface IValueAxisBreakEvents extends IAxisBreakEvents { }

/**
 * Defines adapters for [[ValueAxisBreak]].
 *
 * @see {@link Adapter}
 */
export interface IValueAxisBreakAdapters extends IAxisBreakAdapters, IValueAxisBreakProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Base class to define "breaks" on value axis.
 *
 * A "break" can be used to "cut out" specific ranges of the axis scale, e.g.
 * when comparing columns with relatively similar values, it would make sense
 * to cut out their mid section, so that their tip differences are more
 * prominent.
 *
 * @see {@link IValueAxisBreakEvents} for a list of available events
 * @see {@link IValueAxisBreakAdapters} for a list of available Adapters
 * @important
 */
export class ValueAxisBreak extends AxisBreak {

	/**
	 * Defines available properties.
	 *
	 * @type {IValueAxisBreakProperties}
	 */
	public _properties!: IValueAxisBreakProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IValueAxisBreakAdapters}
	 */
	public _adapter!: IValueAxisBreakAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IValueAxisBreakEvents}
	 */
	public _events!: IValueAxisBreakEvents;

	/**
	 * Defines the type of the Axis this break is used for.
	 *
	 * @type {ValueAxis}
	 */
	public _axisType: ValueAxis;

	/**
	 * [adjustedStep description]
	 *
	 * @ignore Exclude from docs
	 * @todo Description
	 * @type {number}
	 */
	public adjustedStep: number;

	/**
	 * [adjustedMin description]
	 *
	 * @ignore Exclude from docs
	 * @todo Description
	 * @type {number}
	 */
	public adjustedMin: number;

	/**
	 * [adjustedMax description]
	 *
	 * @ignore Exclude from docs
	 * @todo Description
	 * @type {number}
	 */
	public adjustedMax: number;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "ValueAxisBreak";
		this.applyTheme();
	}

	/**
	 * Pixel position of the break's start.
	 *
	 * @return {number} Position (px)
	 * @readonly
	 */
	public get startPosition(): number {
		if (this.axis) {
			return this.axis.valueToPosition(this.adjustedStartValue);
		}
	}

	/**
	 * Pixel position of the break's end.
	 *
	 * @return {number} Position (px)
	 * @readonly
	 */
	public get endPosition(): number {
		if (this.axis) {
			return this.axis.valueToPosition(this.adjustedEndValue);
		}
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["ValueAxisBreak"] = ValueAxisBreak;
