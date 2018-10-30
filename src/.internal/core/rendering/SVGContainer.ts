/**
 * This functionality is related to the HTML wrapper that houses `<svg>` tag.
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Container } from "../Container";
import { IDisposer, Disposer } from "../utils/Disposer";
import * as $utils from "../utils/Utils";
import * as $dom from "../utils/DOM";
import * as $array from "../utils/Array";
import * as $type from "../utils/Type";
import ResizeSensor from "css-element-queries/src/ResizeSensor";



/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */


/**
 * A array of all SVG Containers (one SVG container per chart instance).
 *
 * @ignore Exclude from docs
 * @type {Array<SVGContainer>}
 */
export const svgContainers: Array<SVGContainer> = [];

/**
 * A class used to create an HTML wrapper for the SVG contents.
 */
export class SVGContainer implements IDisposer {

	/**
	 * Indicates if this object has already been deleted. Any
	 * destruction/disposal code should take this into account when deciding
	 * wheter to run potentially costly disposal operations if they already have
	 * been run.
	 *
	 * @type {boolean}
	 */
	protected _disposed: boolean = false;

	/**
	 * Width of HTML element.
	 *
	 * @type {Optional<number>}
	 */
	public width: $type.Optional<number>;

	/**
	 * Height of HTML element.
	 *
	 * @type {Optional<number>}
	 */
	public height: $type.Optional<number>;

	/**
	 * A [[Container]] element which is placed into container.
	 *
	 * @type {Optional<Container>}
	 */
	protected _container: $type.Optional<Container>;

	/**
	 * A parent HTML container that SVG wrapper element is placed in.
	 *
	 * @type {HTMLElement}
	 */
	public htmlElement: HTMLElement;

	/**
	 * If this component is in a separate HTML container, `autoResize` means the
	 * module will constantly measure container's size and adopt contents to it.
	 *
	 * @type {Boolean}
	 */
	public autoResize: Boolean = true;

	/**
	 * A `<div>` element which acts as a wrapper/holder for the SVG element.
	 *
	 * @type {HTMLDivElement}
	 */
	public SVGContainer: HTMLDivElement;


	/**
	 * A reference to ResizeSensor object which monitors changes of div size
	 * @type {ResizeSensor}
	 */
	public resizeSensor: ResizeSensor;


	protected _resizeSensorDisposer: Disposer;

	/**
	 * Constructor
	 *
	 * * Creates an HTML wrapper for SVG
	 */
	constructor(htmlElement: HTMLElement) {

		// Log parent HTML element
		this.htmlElement = htmlElement;

		const callback = () => { this.measure() };

		this.resizeSensor = new ResizeSensor(htmlElement, callback);

		this._resizeSensorDisposer = new Disposer(() => {
			this.resizeSensor.detach(callback);
		});

		// Adds to containers array
		svgContainers.push(this);

		/**
		 * Create child div for the container - it will have svg node
		 * It might seem that this container is not necessay, however having it solves
		 * a problems with mouse position detection and some other.
		 */
		let svgContainer = document.createElement("div");
		let style = svgContainer.style;
		style.width = "100%";
		style.height = "100%";
		style.position = "relative";
		htmlElement.appendChild(svgContainer);

		this.SVGContainer = svgContainer;
	}

	/**
	 * Measures size of parent HTML element.
	 *
	 * @ignore Exclude from docs
	 */
	public measure(): void {
		let width: number = $utils.width(this.htmlElement);
		let height: number = $utils.height(this.htmlElement);
		let container = this.container;
		if (container) {
			if (this.width != width || this.height != height) {
				this.width = width;
				this.height = height;

				if (width > 0) {
					container.maxWidth = width;
				}
				if (height > 0) {
					container.maxHeight = height;
				}

				$dom.fixPixelPerfect(this.SVGContainer);
			}

			if (!container.maxWidth) {
				container.maxWidth = 0;
			}
			if (!container.maxHeight) {
				container.maxHeight = 0;
			}
		}
	}

	/**
	 * A [[Container]] element which is placed into container.
	 *
	 * @param {Optional<Container>}  container  Container
	 */
	public set container(container: $type.Optional<Container>) {
		this._container = container;
		this.measure();
	}

	/**
	 * @return {Optional<Container>} Container
	 */
	public get container(): $type.Optional<Container> {
		return this._container;
	}

	/**
	 * Returns if this object has been already been disposed.
	 *
	 * @return {boolean} Is disposed?
	 */
	public isDisposed(): boolean {
		return this._disposed;
	}

	/**
	 * Removes this container from SVG container list in system, which
	 * effectively disables size change monitoring for it.
	 */
	public dispose(): void {
		if (!this._disposed) {
			$array.remove(svgContainers, this);
		}

		if (this._resizeSensorDisposer) {
			this._resizeSensorDisposer.dispose();
		}
	}
}
