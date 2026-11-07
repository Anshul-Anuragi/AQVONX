import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter.
    Enforces maximum number of requests within a defined rolling time window.
    """
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._history: Dict[str, List[float]] = defaultdict(list)

    def _clean_old_requests(self, key: str, now: float):
        cutoff = now - self.window_seconds
        self._history[key] = [t for t in self._history[key] if t > cutoff]

    def check(self, key: str):
        now = time.time()
        self._clean_old_requests(key, now)

        if len(self._history[key]) >= self.max_requests:
            retry_after = int(self._history[key][0] + self.window_seconds - now) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                headers={"Retry-After": str(max(1, retry_after))},
            )

        self._history[key].append(now)


# 15 handshake requests per minute per IP/client
handshake_limiter = SlidingWindowRateLimiter(max_requests=15, window_seconds=60)

# 45 notes generation requests per minute per client
notes_limiter = SlidingWindowRateLimiter(max_requests=45, window_seconds=60)


async def rate_limit_handshake(request: Request):
    client_ip = request.client.host if request.client else "unknown_client"
    handshake_limiter.check(client_ip)


async def rate_limit_notes(request: Request):
    client_ip = request.client.host if request.client else "unknown_client"
    notes_limiter.check(client_ip)
