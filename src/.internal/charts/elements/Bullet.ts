/**
 * Module that defines everything related to building bullets.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Container, IContainerProperties, IContainerAdapters, IContainerEvents } from "../../core/Container";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { registry } from "../../core/Registry";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[Bullet]].
 */
export interface IBulletProperties extends IContainerProperties {

	/**
	 * Relative horizontal location within cell. (0-1)
	 *
	 * @type {number}
	 */
	locationX?: number;

	/**
	 * Relative vertical location within cell. (0-1)
	 *
	 * @type {number}
	 */
	locationY?: number;

	/**
	 * Specifies if bullet needs to be redrawn if the underlying data changes.
	 *
	 * @type {boolean}
	 */
	isDynamic?: boolean;

	/**
	 * [string description]
	 *
	 * @todo Description
	 * @type {string}
	 */
	xField?: string;

	/**
	 * [string description]
	 *
	 * @todo Description
	 * @type {string}
	 */
	yField?: string;

	/**
	 * Defines if this bullet should be copied to legend marker
	 */
	copyToLegendMarker?: boolean;

}

/**
 * Defines events for [[Bullet]].
 */
export interface IBulletEvents extends IContainerEvents { }

/**
 * Defines adapters for [[Bullet]].
 *
 * @see {@link Adapter}
 */
export interface IBulletAdapters extends IContainerAdapters, IBulletProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Class used to creates bullets.
 *
 * @see {@link IBulletEvents} for a list of available events
 * @see {@link IBulletAdapters} for a list of available Adapters
 * @todo Usage example
 * @important
 */
export class Bullet extends Container {

	/**
	 * Defines available properties.
	 *
	 * @type {IBulletProperties}
	 */
	public _properties!: IBulletProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {IBulletAdapters}
	 */
	public _adapter!: IBulletAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {IBulletEvents}
	 */
	public _events!: IBulletEvents;

	/**
	 * Constructor
	 */
	constructor() {
		super();
		this.className = "Bullet";
		this.isMeasured = false;
		this.tooltipX = 0;
		this.tooltipY = 0;
		this.layout = "none";

		this.applyOnClones = true;

		this.copyToLegendMarker = true;
	}

	/**
	 * Relative horizontal location within cell. (0-1)
	 *
	 * @param {number}  value  Location (0-1)
	 */
	public set locationX(value: number) {
		this.setPropertyValue("locationX", value, false, true);
	}

	/**
	 * @return {number} Location (0-1)
	 */
	public get locationX(): number {
		return this.getPropertyValue("locationX");
	}

	/**
	 * Relative vertical location within cell. (0-1)
	 *
	 * @param {number}  value  Location (0-1)
	 */
	public set locationY(value: number) {
		this.setPropertyValue("locationY", value, false, true);
	}

	/**
	 * @return {number} Location (0-1)
	 */
	public get locationY(): number {
		return this.getPropertyValue("locationY");
	}

	/**
	 * [xField description]
	 *
	 * @todo Description
	 * @param {string}  value  [description]
	 */
	public set xField(value: string) {
		this.setPropertyValue("xField", value, true);
	}

	/**
	 * @return {string} [description]
	 */
	public get xField(): string {
		return this.getPropertyValue("xField");
	}

	/**
	 * [yField description]
	 *
	 * Description
	 * @param {string}  value  [description]
	 */
	public set yField(value: string) {
		this.setPropertyValue("yField", value, true);
	}

	/**
	 * @return {string} [description]
	 */
	public get yField(): string {
		return this.getPropertyValue("yField");
	}

	/**
	 * Indicates if the bullet is "dynamic".
	 *
	 * In most cases the bullets remain the same, even if the underlying data
	 * changes.
	 *
	 * However, in cases where bullet also displays a label, or its size depends
	 * on data, it also needs to be redrawn when the underlying data changes.
	 *
	 * Only those bullets that have set `isDynamic = true` will be redrawn each
	 * time data changes. Regular bullets will be reused as they are.
	 *
	 * @default false
	 * @param {boolean}  value  Redraw on data change?
	 */
	public set isDynamic(value: boolean) {
		this.setPropertyValue("isDynamic", value, true);
	}

	/**
	 * @return {boolean} Redraw on data change?
	 */
	public get isDynamic(): boolean {
		return this.getPropertyValue("isDynamic");
	}


	/**
	 * Indicates if the bullet should be copied to legend marker
	 *
	 * @default false
	 * @param {boolean}  value  Redraw on data change?
	 */
	public set copyToLegendMarker(value: boolean) {
		this.setPropertyValue("copyToLegendMarker", value);
	}

	/**
	 * @return {boolean} Redraw on data change?
	 */
	public get copyToLegendMarker(): boolean {
		return this.getPropertyValue("copyToLegendMarker");
	}

}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["Bullet"] = Bullet;
