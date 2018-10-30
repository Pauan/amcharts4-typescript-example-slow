/**
 * Map arched line module
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { MapLine, IMapLineProperties, IMapLineAdapters, IMapLineEvents } from "./MapLine";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { Polyarc } from "../../core/elements/Polyarc";
import { registry } from "../../core/Registry";
import { MapArcSeries } from "./MapArcSeries";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[MapArc]].
 */
export interface IMapArcProperties extends IMapLineProperties { }

/**
 * Defines events for [[MapArc]].
 */
export interface IMapArcEvents extends IMapLineEvents { }

/**
 * Defines adapters for [[MapArc]].
 *
 * @see {@link Adapter}
 */
export interface IMapArcAdapters extends IMapLineAdapters, IMapArcProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Used to draw an arched line on the map.
 *
 * @see {@link IMapArcEvents} for a list of available events
 * @see {@link IMapArcAdapters} for a list of available Adapters
 */
export class MapArc extends MapLine {

	/**
	 * Defines available properties.
	 *
	 * @type {IMapArcProperties}
	 */
	public _properties!: IMapArcProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IMapArcAdapters}
	 */
	public _adapter!: IMapArcAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IMapArcEvents}
	 */
	public _events!: IMapArcEvents;

	/**
	 * A visual element.
	 *
	 * @type {Polyarc}
	 */
	public line: Polyarc;

	/**
	 * A map series this object belongs to.
	 *
	 * @type {MapArcSeries}
	 */
	public series: MapArcSeries;

	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "MapArc";

		// Create a line
		this.line = new Polyarc();

		// Apply theme
		this.applyTheme();

	}


	/**
	 * ShortestDistance = true is not supported by MapArc, only MapLine does support it
	 * @default false
	 * @param {boolean}  value
	 * @todo: review description
	 */
	public get shortestDistance(): boolean {
		return false;
	}

	public set shortestDistance(value: boolean) {

	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["MapArc"] = MapArc;
