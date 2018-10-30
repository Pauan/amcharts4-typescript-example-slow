/**
 * Cursor module
 */

/**
 * ============================================================================
 * IMPORTS
 * ============================================================================
 * @hidden
 */
import { Container, IContainerProperties, IContainerAdapters, IContainerEvents } from "../../core/Container";
import { SpriteEventDispatcher, AMEvent } from "../../core/Sprite";
import { getInteraction, IInteractionEvents } from "../../core/interaction/Interaction";
import { IInteractionObjectEvents } from "../../core/interaction/InteractionObjectEvents";
import { IPoint, } from "../../core/defs/IPoint";
import { Chart } from "../Chart";
import { registry } from "../../core/Registry";
import { percent } from "../../core/utils/Percent";
import { MouseCursorStyle } from "../../core/interaction/Mouse";
import * as $math from "../../core/utils/Math";
import * as $utils from "../../core/utils/Utils";
import * as $type from "../../core/utils/Type";
import { Animation } from "../../core/utils/Animation";


/**
 * ============================================================================
 * REQUISITES
 * ============================================================================
 * @hidden
 */

/**
 * Defines properties for [[Cursor]].
 */
export interface ICursorProperties extends IContainerProperties { }

/**
 * Defines events for [[Cursor]].
 */
export interface ICursorEvents extends IContainerEvents {

	/**
	 * Invoked when position of cursor changes.
	 */
	cursorpositionchanged: {};

	/**
	 * Invoked when user starts selecting a range with a cursor, e.g. presses
	 * down mouse button and drags the cursor.
	 */
	selectstarted: {};

	/**
	 * Invoked when selection has ended, e.g. user releases mouse button.
	 */
	selectended: {};

	/**
	 * Invoked when user starts zooming using cursor.
	 */
	zoomstarted: {};

	/**
	 * Invoked when user clicked to start zooming/panning/selecting but haven't
	 * finished the operation.
	 */
	behaviorcanceled: {};

	/**
	 * Invoked when user is done zooming using cursor.
	 */
	zoomended: {};

	/**
	 * Invoked when user starts panning using cursor.
	 */
	panstarted: {};

	/**
	 * Invoked when user is done panning using cursor.
	 */
	panended: {};

	/**
	 * Invoked when user is panning using cursor.
	 */
	panning: {};
}

/**
 * Defines adapters for [[Cursor]].
 *
 * @see {@link Adapter}
 */
export interface ICursorAdapters extends IContainerAdapters, ICursorProperties { }


/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */

/**
 * Main Cursor class with common cursor functionality.
 *
 * Chart-specific cursors must extend this class.
 *
 * @see {@link ICursorEvents} for a list of available events
 * @see {@link ICursorAdapters} for a list of available Adapters
 * @todo Add description, examples
 * @todo Should we allow changing `_generalBehavior`?
 */
export class Cursor extends Container {

	/**
	 * Defines available properties.
	 *
	 * @type {ICursorProperties}
	 */
	public _properties!: ICursorProperties;

	/**
	 * Defines available adapters.
	 *
	 * @type {ICursorAdapters}
	 */
	public _adapter!: ICursorAdapters;

	/**
	 * Defines available events.
	 *
	 * @type {ICursorEvents}
	 */
	public _events!: ICursorEvents;

	/**
	 * Point coordinates of where selection started.
	 *
	 * @type {IPoint}
	 */
	public downPoint: IPoint;

	/**
	 * Point coordinates of where selection ended.
	 *
	 * @type {IPoint}
	 */
	public upPoint: IPoint;

	/**
	 * Current cursor position during selection.
	 *
	 * @type {IPoint}
	 * @todo Better description
	 */
	public point: IPoint = { x: 0, y: 0 };

	/**
	 * Relative horizontal position.
	 *
	 * @type {number}
	 * @todo: maybe we should make getter only? it is used from outside by axes or series to show tooltips at some position
	 */
	public xPosition: number;

	/**
	 * Relative vertical position.
	 *
	 * @type {number}
	 * @todo: maybe we should make getter only? it is used from outside by axes or series to show tooltips at some position
	 */
	public yPosition: number;

	/**
	 * [_usesSelection description]
	 *
	 * @todo Description
	 * @type {boolean}
	 */
	protected _usesSelection: boolean;

	/**
	 * What to do when user pressed down and drags cursor: zoom or select.
	 *
	 * @type {"zoom" | "select"}
	 */
	protected _generalBehavior: "zoom" | "select" | "pan"; // todo: draw

	/**
	 * A reference to chart cursor belongs to.
	 *
	 * @type {Chart}
	 */
	public _chart: Chart;

	/**
	 * Specifies the rules when cursor needs to be moved or hidden.
	 */
	protected _stick: "hard" | "soft" | "none" = "none";

	/**
	 * A screen point that cursor is "stuck" to.
	 *
	 * @type {IPoint}
	 */
	protected _stickPoint: IPoint;

	/**
	 * Constructor
	 */
	constructor() {

		// Init
		super();
		this.className = "Cursor";

		// Set defaults
		//this.background.fillOpacity = 0.5;
		//this.background.fill = color("#dadada");
		this.width = percent(100);
		this.height = percent(100);
		this.shouldClone = false;

		this.hide(0);

		this.trackable = true;
		this.clickable = true;

		this.isMeasured = false;

		// Add events on body to trigger down and up events (to start zooming or
		// selection)
		const interaction = getInteraction();
		this._disposers.push(interaction.body.events.on("down", this.handleCursorDown, this));
		this._disposers.push(interaction.body.events.on("up", this.handleCursorUp, this));
		this._disposers.push(interaction.body.events.on("track", this.handleCursorMove, this));

		// Apply theme
		this.applyTheme();

	}

	/**
	 * Handle pointer movement in document and update cursor position as needed.
	 *
	 * @ignore Exclude from docs
	 * @param {IInteractionObjectEvents["track"]} event Event
	 */
	public handleCursorMove(event: IInteractionObjectEvents["track"]): IPoint {
		if (!this.interactionsEnabled) {
			return;
		}
		if (((this._generalBehavior != "zoom" && this._generalBehavior != "pan") || !this.downPoint) && !getInteraction().isLocalElement(event.pointer, this.paper.svg, this.uid)) {
			// We want to let zoom/pan continue even if cursor is outside chart area
			if (!this.isHidden || !this.isHiding) {
				this.hide();
			}
			return;
		}
		let local: IPoint = $utils.documentPointToSprite(event.pointer.point, this);

		if (this._stick == "hard" && this._stickPoint) {
			local = this._stickPoint;
		}

		if (this._stick == "soft" && this._stickPoint) {
			if (!this.fitsToBounds(local)) {
				local = this._stickPoint;
			}
		}

		this.triggerMove(local);
		return local;
	}


	/**
	 * Hides actual SVG elements and handles hiding animations.
	 *
	 * @param  {number}  duration  Fade out duration (ms)
	 * @return {Animation}            Fade out duration (ms)
	 * @ignore
	 */
	protected hideReal(duration?: number): $type.Optional<Animation> {
		if ((this._stick == "hard" || this._stick == "soft") && this._stickPoint) {
			return;
		}
		return super.hideReal(duration);
	}


	/**
	 * Places the cursor at specific point.
	 *
	 * The second parameter has following options:
	 *
	 * `"none"` - placed cursor will only be there until mouse/touch moves, then
	 * it either moves to a new place (if pointer over plot area) or is hidden.
	 *
	 * `"soft"` - cursor will stay in the place if mouse/touch is happening
	 * outside chart, but will move to a new place whe plot area is hovered or
	 * touched.
	 *
	 * `"hard"` - cursor will stay in place no matter what, until it is moved by
	 * another `triggerMove()` call.
	 *
	 * @param {IPoint}                    point  Point to place cursor at
	 * @param {"hard" | "soft" | "none"}  stick  Level of cursor stickiness to the place
	 */
	public triggerMove(point: IPoint, stick?: "hard" | "soft" | "none"): void {

		if (stick) {
			this._stick = stick;
		}

		if (stick == "hard" || stick == "soft") {
			this._stickPoint = point;
		}

		this.triggerMoveReal(point);
	}

	/**
	 * Places the cursor at specific point.
	 *
	 * @param {IPoint}  point Point to place cursor at
	 */
	protected triggerMoveReal(point: IPoint): void {
		if (this.point.x != point.x || this.point.y != point.y) {
			// hide cursor if it's out of bounds
			if (this.fitsToBounds(point)) {
				this.show(0);
			}
			else {
				// unless we are selecting (mouse is down)
				if (!this.downPoint) {
					this.hide(0);
				}
			}

			this.point = point;
			if (this.visible) {
				this.getPositions();

				this.dispatch("cursorpositionchanged"); // not good to dispatch later (check step count example)
			}
		}
	}

	/**
	 * Simulates pressing down (click/touch) action by a cursor.
	 *
	 * @param {IPoint}   point               Point of action
	 */
	public triggerDown(point: IPoint) {
		this.triggerDownReal(point);
	}

	/**
	 * Simulates pressing down (click/touch) action by a cursor.
	 *
	 * @param {IPoint}   point               Point of action
	 */
	protected triggerDownReal(point: IPoint) {
		switch (this._generalBehavior) {
			case "zoom":
				this.dispatchImmediately("zoomstarted");
				break;
			case "select":
				this.dispatchImmediately("selectstarted");
				break;
			case "pan":
				this.dispatchImmediately("panstarted");
				getInteraction().setGlobalStyle(MouseCursorStyle.grabbing);
				break;
		}
	}

	/**
	 * Simulates the action of release of the mouse down / touch.
	 *
	 * @param {IPoint}   point               Point of action
	 */
	public triggerUp(point: IPoint) {
		this.triggerUpReal(point);
	}

	/**
	 * Simulates the action of release of the mouse down / touch.
	 *
	 * @param {IPoint}   point               Point of action
	 */
	protected triggerUpReal(point: IPoint) {

		this.updatePoint(this.upPoint);
		let interaction = getInteraction();
		if ($math.getDistance(this.upPoint, this.downPoint) > interaction.getHitOption(this.interactions, "hitTolerance")) {
			switch (this._generalBehavior) {
				case "zoom":
					this.dispatchImmediately("zoomended");
					break;

				case "select":
					this.dispatchImmediately("selectended");
					break;

				case "pan":
					this.dispatchImmediately("panended");
					interaction.setGlobalStyle(MouseCursorStyle.default);
					break;
			}
		}
		else {
			this.dispatchImmediately("behaviorcanceled");
			interaction.setGlobalStyle(MouseCursorStyle.default);
		}

		this.downPoint = undefined;
		this.updateSelection();
	}

	/**
	 * Updates selection dimensions on size change.
	 *
	 * @ignore Exclude from docs
	 */
	public updateSelection(): void {
	}

	/**
	 * Updates cursors current positions.
	 */
	protected getPositions(): void {
		// positions are used by axes or series
		this.xPosition = this.point.x / this.innerWidth;
		this.yPosition = 1 - this.point.y / this.innerHeight;
	}

	/**
	 * Handles pointer down event so we can start zoom or selection.
	 *
	 * @ignore Exclude from docs
	 * @param {IInteractionEvents["down"]} event Original event
	 */
	public handleCursorDown(event: IInteractionEvents["down"]): void {
		if (!this.interactionsEnabled || !getInteraction().isLocalElement(event.pointer, this.paper.svg, this.uid)) {
			return;
		}
		// Get local point
		let local: IPoint = $utils.documentPointToSprite(event.pointer.point, this);

		// We need to cancel the event to prevent gestures on touch devices
		if (event.event.cancelable && this.fitsToBounds(local)) {
			event.event.preventDefault();
		}

		// Make this happen
		this.triggerMove(local);
		this.triggerDown(local);
	}

	/**
	 * Updates the coordinates of where pointer down event occurred
	 * (was pressed).
	 */
	protected updatePoint(point: IPoint) {
	}

	/**
	 * Handles pointer up event - finishes zoom or selection action.
	 *
	 * @ignore Exclude from docs
	 * @param {IInteractionEvents["up"]} event Original event
	 */
	public handleCursorUp(event: IInteractionEvents["up"]): void {
		if (!this.interactionsEnabled) {
			return;
		}
		if (((this._generalBehavior != "zoom" && this._generalBehavior != "pan") || !this.downPoint) && !getInteraction().isLocalElement(event.pointer, this.paper.svg, this.uid)) {
			return;
		}
		let local: IPoint = $utils.documentPointToSprite(event.pointer.point, this);
		this.triggerMove(local);
		this.triggerUp(local);
	}

	/**
	 * A reference to a [[Chart]] the cursor belongs to.
	 *
	 * @param {Chart}  value  Chart
	 */
	public set chart(value: this["_chart"]) {
		this._chart = value;
		if ($type.hasValue((<any>this._chart).plotContainer)) {
			getInteraction().lockElement((<any>this._chart).plotContainer.interactions);
		}
	}

	/**
	 * @return {Chart} Chart
	 */
	public get chart(): this["_chart"] {
		return this._chart;
	}
}

/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["Cursor"] = Cursor;
