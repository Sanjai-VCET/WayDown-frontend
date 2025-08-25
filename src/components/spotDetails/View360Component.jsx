import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button, Spinner, Alert, Modal } from "react-bootstrap";
import axios from "axios";
import PropTypes from "prop-types";
import { Viewer } from '@photo-sphere-viewer/core';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import { StereoPlugin } from '@photo-sphere-viewer/stereo-plugin';

import '@photo-sphere-viewer/core/index.css';
// Removed CSS imports for plugins as they don't exist in v5

import NoSleep from "nosleep.js";

const View360Component = ({ spotId }) => {
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const viewerRef = useRef(null);
  const viewerInstance = useRef(null);
  const noSleepRef = useRef(null);

  const isSecure = () => {
    // WebXR & motion sensors typically require secure contexts
    if (typeof window === "undefined") return false;
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local");
    return window.isSecureContext || isLocalhost;
  };

  const fetchViewData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/spots/${spotId}/360-view`, {
        timeout: 10000,
      });

      if (!response.data?.imageUrl) {
        throw new Error("No 360° image URL found");
      }

      // Preflight: verify image is reachable
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load 360° image"));
        img.src = response.data.imageUrl;
      });

      setViewData(response.data);
    } catch (err) {
      setError(err?.message || "Failed to load 360° view");
    } finally {
      setLoading(false);
    }
  }, [spotId]);

  useEffect(() => {
    if (spotId) fetchViewData();
  }, [spotId, fetchViewData]);

  // iOS 13+ requires explicit permission for motion sensors.
  const requestMotionPermission = async () => {
    try {
      const motionNeedsPermission =
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function";
      const orientationNeedsPermission =
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function";

      if (motionNeedsPermission) {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== "granted") return false;
      }
      if (orientationNeedsPermission) {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== "granted") return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleOpenModal = async () => {
    // Warn early for insecure contexts
    if (!isSecure()) {
      setError(
        "VR and motion sensors require HTTPS or localhost. Please serve the app over HTTPS."
      );
      return;
    }
    setShowModal(true);
  };

    const handleModalEntered = async () => {
        console.log("View Data:", viewData);
        if (viewerRef.current) {
            console.log("Viewer Ref Dimensions:", viewerRef.current.offsetWidth, viewerRef.current.offsetHeight);
        }
        if (!viewData?.imageUrl || !viewerRef.current) return;

    try {
      // Ensure container has size
      const container = viewerRef.current;
      if (!container.offsetWidth || !container.offsetHeight) {
        throw new Error("Viewer container has zero dimensions");
      }

      // Init NoSleep
      noSleepRef.current = new NoSleep();

      // Create the viewer with both plugins
      viewerInstance.current = new Viewer({
        container: container,
        panorama: viewData.imageUrl,
        loadingImg:
          "https://photo-sphere-viewer.js.org/assets/photosphere-logo.gif",
        loadingTxt: "Loading 360° view...",
        size: { width: "100%", height: "100%" },
        touchmoveTwoFingers: true,
        mousewheel: true,
        navbar: [
          "zoom",
          "move",
          "fullscreen",
          "caption",
          "autorotate",
          "gyroscope", // provided by GyroscopePlugin
          "stereo",    // provided by StereoPlugin
        ],
        plugins: [
          [
            GyroscopePlugin,
            {
              autostart: false, // we will request permission and start explicitly
              moveSpeed: 1.0,
              lockUserInteraction: false,
            },
          ],
          [
            StereoPlugin,
            {
              // Optional tunables; defaults are reasonable
              // enableTouchZoom: false,
              // moveMode: "smooth",
            },
          ],
        ],
      });

      // Keep screen awake when sensors/VR are active
      const onStartGyro = () => noSleepRef.current?.enable();
      const onStopGyro = () => noSleepRef.current?.disable();

      viewerInstance.current.on("start-gyroscope", onStartGyro);
      viewerInstance.current.on("stop-gyroscope", onStopGyro);

      // Try to start gyroscope after permission (mobile only)
      const gyro = viewerInstance.current.getPlugin(GyroscopePlugin);
      if (gyro) {
        // If device can provide orientation, request permission where required
        const granted = await requestMotionPermission();
        // Even if false (e.g., desktop), this call is safe; we'll catch error
        if (granted) {
          try {
            await gyro.start();
          } catch (e) {
            // If start fails, surface a subtle message but keep viewer usable
            console.warn("Gyroscope start failed:", e);
          }
        } else {
          console.warn("Motion permission not granted or not needed.");
        }
      }
    } catch (err) {
      console.error("Viewer initialization failed:", err);
      setError(`Viewer error: ${err.message}`);
    }
  };

  const handleModalExit = () => {
    try {
      if (viewerInstance.current) {
        viewerInstance.current.destroy();
        viewerInstance.current = null;
      }
      if (noSleepRef.current) {
        noSleepRef.current.disable();
        noSleepRef.current = null;
      }
    } catch {
      // ignore
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <Card.Body className="text-center py-3">
          <Card.Title className="d-flex align-items-center justify-content-center">
            <i
              className="bi bi-camera-video text-primary me-2"
              aria-hidden="true"
            />
            360° View
          </Card.Title>

          {loading && <Spinner animation="border" size="sm" className="me-2" />}

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
              <Button variant="link" onClick={fetchViewData} className="p-0 ms-2">
                Retry
              </Button>
            </Alert>
          )}

          {!error && !loading && !viewData?.imageUrl && (
            <p className="text-muted small mb-0">
              No 360° view available for this spot.
            </p>
          )}

          {!error && !loading && viewData?.imageUrl && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleOpenModal}
              aria-label="Open 360° view"
            >
              <i className="bi bi-arrows-fullscreen me-2" aria-hidden="true" />
              View in 360° / VR
            </Button>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="xl"
        centered
        onEntered={handleModalEntered}
        onExited={handleModalExit}
        fullscreen="md-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>360° View</Modal.Title>
        </Modal.Header>

        <Modal.Body
          className="p-0 m-0"
          style={{
            height: "80vh",
            minHeight: "420px",
            maxHeight: "100vh",
            position: "relative",
          }}
        >
          <div
            ref={viewerRef}
            style={{
              width: "100%",
              height: "100%",
            }}
          />

          {(loading || !viewData) && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                zIndex: 1000,
              }}
            >
              <Spinner animation="border" />
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

View360Component.propTypes = {
  spotId: PropTypes.string.isRequired,
};

export default View360Component;
