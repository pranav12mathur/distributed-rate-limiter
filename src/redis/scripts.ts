
export const TOKEN_BUCKET_SCRIPT = `
local t = redis.call("TIME")
local now = tonumber(t[1]) * 1000
    + math.floor(tonumber(t[2]) / 1000)

local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local state = redis.call("HMGET", KEYS[1], "tokens", "time")
local tokens = tonumber(state[1]) or capacity
local last_time = tonumber(state[2]) or now

local elapsed = math.max(0, now - last_time) / 1000
tokens = math.min(capacity, tokens + elapsed * refill_rate)

local allowed = 0
local retry_after = 0

if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
elseif refill_rate > 0 then
    retry_after = math.ceil(
        ((cost - tokens) / refill_rate) * 1000
    )
else
    retry_after = -1
end

redis.call("HSET", KEYS[1],
    "tokens", tokens,
    "time", now
)
redis.call("PEXPIRE", KEYS[1], ttl)

return {
    allowed,
    math.floor(tokens * 1000000) / 1000000,
    retry_after
}
`;

export const SLIDING_WINDOW_SCRIPT = `
local t = redis.call("TIME")
local now = tonumber(t[1]) * 1000
    + math.floor(tonumber(t[2]) / 1000)

local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local request_id = ARGV[3]

redis.call(
    "ZREMRANGEBYSCORE",
    KEYS[1],
    "-inf",
    now - window
)

local count = redis.call("ZCARD", KEYS[1])
local allowed = 0
local retry_after = 0

if count < limit then
    redis.call("ZADD", KEYS[1], now, request_id)
    count = count + 1
    allowed = 1
else
    local oldest = redis.call(
        "ZRANGE", KEYS[1], 0, 0, "WITHSCORES"
    )

    if oldest[2] then
        retry_after = math.max(
            0, tonumber(oldest[2]) + window - now
        )
    end
end

redis.call("PEXPIRE", KEYS[1], window + 1000)

return {
    allowed,
    math.max(0, limit - count),
    retry_after
}
`;
