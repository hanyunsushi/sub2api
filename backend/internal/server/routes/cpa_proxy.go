package routes

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	cpaManagementProxyPrefix        = "/cpa-management"
	defaultCPAManagementProxyTarget = "http://host.docker.internal:8317/v0/management"
)

// RegisterCPAManagementProxyRoutes proxies browser-local CPA management calls to
// the local CPA service. CPA remains the authority for its management key.
func RegisterCPAManagementProxyRoutes(r *gin.Engine) {
	target := strings.TrimSpace(os.Getenv("CPA_MANAGEMENT_PROXY_TARGET"))
	if target == "" {
		target = defaultCPAManagementProxyTarget
	}

	proxy, err := newCPAManagementProxy(target)
	if err != nil {
		r.Any(cpaManagementProxyPrefix, invalidCPAManagementProxyTarget(err))
		r.Any(cpaManagementProxyPrefix+"/*path", invalidCPAManagementProxyTarget(err))
		return
	}

	handler := gin.WrapH(proxy)
	r.Any(cpaManagementProxyPrefix, handler)
	r.Any(cpaManagementProxyPrefix+"/*path", handler)
}

func invalidCPAManagementProxyTarget(err error) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusBadGateway, gin.H{
			"error":   "CPA_MANAGEMENT_PROXY_TARGET_INVALID",
			"message": err.Error(),
		})
	}
}

func newCPAManagementProxy(rawTarget string) (*httputil.ReverseProxy, error) {
	target, err := url.Parse(rawTarget)
	if err != nil {
		return nil, err
	}
	if target.Scheme == "" || target.Host == "" {
		return nil, &url.Error{Op: "parse", URL: rawTarget, Err: errMissingProxySchemeOrHost{}}
	}

	basePath := strings.TrimRight(target.EscapedPath(), "/")
	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		incomingPath := req.URL.EscapedPath()
		originalDirector(req)

		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host
		req.URL.Path = joinCPAProxyPath(basePath, strings.TrimPrefix(incomingPath, cpaManagementProxyPrefix))
		req.URL.RawPath = ""
		req.Host = target.Host

		// Do not leak Sub2API browser session cookies to CPA. Authorization is
		// preserved because CPA validates its own management key.
		req.Header.Del("Cookie")
	}
	return proxy, nil
}

func joinCPAProxyPath(basePath, suffix string) string {
	suffix = strings.TrimLeft(suffix, "/")
	if basePath == "" {
		if suffix == "" {
			return "/"
		}
		return "/" + suffix
	}
	if suffix == "" {
		return basePath
	}
	return basePath + "/" + suffix
}

type errMissingProxySchemeOrHost struct{}

func (errMissingProxySchemeOrHost) Error() string {
	return "missing scheme or host"
}
