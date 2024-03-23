import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

const createToken = async (
  payload: Record<string, unknown>,
  secret: Secret,
  expireTime: string
): Promise<string> => {
  return jwt.sign(payload, secret, {
    expiresIn: expireTime,
  });
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtToken = {
  createToken,
  verifyToken,
};
