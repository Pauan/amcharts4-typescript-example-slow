/**
 * Map line module
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Container, IContainerProperties, IContainerAdapters, IContainerEvents } from "../../core/Container";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { MapLine } from "./MapLine";
import { IOrientationPoint } from "../../core/defs/IPoint";
import { registry } from "../../core/Registry";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[MapLineObject]].
 */
export interface IMapLineObjectProperties extends IContainerProperties {

	/**
	 * [number description]
	 *
	 * @todo Description
	 * @type {number}
	 */
	position?: number;

	/**
	 * [boolean description]
	 *
	 * @todo Description
	 * @type {boolean}
	 */
	adjustRotation?: boolean;

}

/**
 * Defines events for [[MapLineObject]].
 */
export interface IMapLineObjectEvents extends IContainerEvents { }

/**
 * Defines adapters for [[MapLineObject]].
 *
 * @see {@link Adapter}
 */
export interface IMapLineObjectAdapters extends IContainerAdapters, IMapLineObjectProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Draws a line on the map.
 *
 * @see {@link IMapLineObjectEvents} for a list of available events
 * @see {@link IMapLineObjectAdapters} for a list of available Adapters
 */
export class MapLineObject extends Container {

	/**
	 * Defines available properties.
	 *
	 * @type {IMapLineObjectProperties}
	 */
	public _properties!: IMapLineObjectProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IMapLineObjectAdapters}
	 */
	public _adapter!: IMapLineObjectAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IMapLineObjectEvents}
	 */
	public _events!: IMapLineObjectEvents;

	/**
	 * [mapLine description]
	 *
	 * @todo Description
	 * @todo Review if necessary (same as parent)
	 * @type {MapLine}
	 */
	public mapLine: MapLine;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.adjustRotation = true;
		this.className = "MapLineObject";
		this.isMeasured = false;
		this.layout = "none";
		this.applyTheme();
	}

	/**
	 * (Re)validates element's position.
	 *
	 * @ignore Exclude from docs
	 */
	public validatePosition() {
		if (this.mapLine) {
			let point: IOrientationPoint = this.mapLine.positionToPoint(this.position);
			this.x = point.x;
			this.y = point.y;

			if (this.adjustRotation) {
				this.rotation = point.angle;
			}

			let dataItem = this.mapLine.dataItem;
			if (dataItem) {
				let series = this.mapLine.dataItem.component;
				this.scale = 1 / series.scale;
			}
		}

		super.validatePosition();
	}

	/**
	 * [position description]
	 *
	 * @todo Description
	 * @param {number} value [description]
	 */
	public set position(value: number) {
		this.setPropertyValue("position", value, false, true);
	}

	/**
	 * @return {number} [description]
	 */
	public get position(): number {
		return this.getPropertyValue("position");
	}

	/**
	 * [adjustRotation description]
	 *
	 * @todo Description
	 * @param {boolean} value [description]
	 */
	public set adjustRotation(value: boolean) {
		this.setPropertyValue("adjustRotation", value, false, true);
	}

	/**
	 * @return {boolean} [description]
	 */
	public get adjustRotation(): boolean {
		return this.getPropertyValue("adjustRotation");
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["MapLineObject"] = MapLineObject;
